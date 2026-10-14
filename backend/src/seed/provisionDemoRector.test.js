const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');
const env = require('../config/env');
const { ROLES } = require('../constants');
const { provisionDemoRector } = require('./provisionDemoRector');

async function withOverrides(overrides, action) {
  const originals = overrides.map(([target, replacement]) => [
    target,
    Object.fromEntries(Object.keys(replacement).map((key) => [key, target[key]]))
  ]);
  for (const [target, replacement] of overrides) Object.assign(target, replacement);
  try { return await action(); }
  finally {
    for (const [target, original] of originals) Object.assign(target, original);
  }
}

function setup({ marker = null, emailUser = null, hostelActive = true, hostelName = 'Active House' } = {}) {
  const hostel = {
    _id: 'hostel-1', name: hostelName, isActive: hostelActive, rectorId: null,
    async save() { this.saved = true; }
  };
  const users = { marker, emailUser, created: null };
  const query = (getUser) => ({
    then(resolve, reject) { return Promise.resolve(getUser()).then(resolve, reject); },
    select() { return Promise.resolve(getUser()); }
  });
  const userOverrides = {
    findOne: (filter) => query(() => filter.employeeId ? users.marker : users.emailUser),
    findById: async () => users.emailUser,
    countDocuments: async () => 0,
    create: async (data) => {
      // Mongoose create invokes the User pre-save hashing hook in production.
      users.created = {
        ...data, _id: 'user-1',
        async comparePassword(candidate) { return candidate === this.password; },
        toJSON() { const { password, ...safe } = this; return safe; }
      };
      users.emailUser = users.created;
      users.marker = users.created;
      return users.created;
    }
  };
  const hostelOverrides = {
    findOne: async ({ name }) => name === hostel.name ? hostel : null,
    findById: async () => hostel
  };
  const reportOverrides = { countDocuments: async () => 0 };
  return { hostel, users, userOverrides, hostelOverrides, reportOverrides };
}

function modelOverrides(state) {
  return [
    [User, state.userOverrides], [Hostel, state.hostelOverrides],
    [LostReport, state.reportOverrides], [FoundReport, state.reportOverrides]
  ];
}

async function configured(action) {
  const previous = [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD, env.DEMO_HOSTEL_NAME];
  env.DEMO_RECTOR_EMAIL = 'demo@example.edu';
  env.DEMO_RECTOR_PASSWORD = 'safe-demo-password';
  env.DEMO_HOSTEL_NAME = 'Active House';
  try { return await action(); }
  finally { [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD, env.DEMO_HOSTEL_NAME] = previous; }
}

test('provisions active Rector linked to exact active hostel and verifies password through model method', async () => {
  const state = setup();
  await configured(() => withOverrides(modelOverrides(state), async () => {
    const result = await provisionDemoRector();
    assert.deepEqual(result, { hostelName: 'Active House', created: true });
    assert.equal(state.users.created.role, ROLES.RECTOR);
    assert.equal(state.users.created.employeeId, 'DEMO-RECTOR');
    assert.equal(state.users.created.isActive, true);
    assert.equal(state.users.created.hostelId, state.hostel._id);
    assert.equal(state.hostel.rectorId, 'user-1');
    assert.equal(state.hostel.isActive, true);
    assert.equal(await state.users.created.comparePassword(env.DEMO_RECTOR_PASSWORD), true);
  }));
});

test('rerun updates only the reserved demo account and does not create a duplicate', async () => {
  const state = setup();
  const marker = {
    _id: 'user-1', name: 'FikrNot Demo Rector', designation: 'Demo Rector',
    email: 'demo@example.edu', role: 'rector', employeeId: 'DEMO-RECTOR',
    hostelId: state.hostel._id, isActive: true, async save() { this.saved = true; },
    async comparePassword(candidate) { return candidate === this.password; },
    toJSON() { const { password, ...safe } = this; return safe; }
  };
  state.users.marker = marker;
  state.users.emailUser = marker;
  state.hostel.rectorId = marker._id;
  await configured(() => withOverrides(modelOverrides(state), async () => {
    const result = await provisionDemoRector();
    assert.equal(result.created, false);
    assert.equal(state.users.created, null);
    assert.equal(marker.password, env.DEMO_RECTOR_PASSWORD);
    assert.equal(marker.saved, true);
  }));
});

test('rejects configured email owned by unrelated account without changing it', async () => {
  const state = setup({ emailUser: { _id: 'other', email: 'demo@example.edu', role: 'rector' } });
  await configured(() => withOverrides(modelOverrides(state), async () => {
    await assert.rejects(provisionDemoRector(), /already belongs to another account/);
    assert.equal(state.users.emailUser._id, 'other');
    assert.equal(state.users.created, null);
  }));
});

test('requires exact active hostel name and does not activate or create hostels', async () => {
  const state = setup({ hostelActive: false });
  await configured(() => withOverrides(modelOverrides(state), async () => {
    await assert.rejects(provisionDemoRector(), /existing active hostel/);
    assert.equal(state.users.created, null);
    assert.equal(state.hostel.isActive, false);
  }));
});

test('refuses to attach a new Demo Rector to an active hostel that already has data', async () => {
  const state = setup();
  state.userOverrides.countDocuments = async () => 1;
  await configured(() => withOverrides(modelOverrides(state), async () => {
    await assert.rejects(provisionDemoRector(), /no existing records/);
    assert.equal(state.users.created, null);
    assert.equal(state.hostel.rectorId, null);
  }));
});

test('rejects a demo password that cannot be checked against the stored hash', async () => {
  const state = setup();
  const originalCreate = state.userOverrides.create;
  state.userOverrides.create = async (data) => {
    const created = await originalCreate(data);
    created.comparePassword = async () => false;
    return created;
  };
  await configured(() => withOverrides(modelOverrides(state), async () => {
    await assert.rejects(provisionDemoRector(), /password verification failed/);
  }));
});
