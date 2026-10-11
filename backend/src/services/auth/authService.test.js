const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../../models/User');
const Hostel = require('../../models/Hostel');
const env = require('../../config/env');
const { registerValidator } = require('../../utils/validators');
const { authorize, verifyRectorHostelScope } = require('../../middlewares/roleMiddleware');
const FoundReport = require('../../models/FoundReport');
const foundService = require('../found/foundService');
const authService = require('./authService');

const withOverrides = async (overrides, action) => {
  const originals = overrides.map(([target, replacement]) => [
    target,
    Object.fromEntries(Object.keys(replacement).map((key) => [key, target[key]]))
  ]);
  for (const [target, replacement] of overrides) Object.assign(target, replacement);
  try {
    return await action();
  } finally {
    for (const [target, value] of originals) Object.assign(target, value);
  }
};

function makeUser({
  id = '65a000000000000000000001',
  email = 'rector@example.edu',
  role = 'rector',
  employeeId,
  hostelId = '65a000000000000000000002',
  password = 'valid-demo-password',
  isActive = true
} = {}) {
  return {
    _id: id,
    email,
    role,
    employeeId,
    hostelId,
    isActive,
    async comparePassword(candidate) { return candidate === password; },
    toJSON() { return { _id: id, email, role, hostelId, employeeId }; }
  };
}

test('valid Rector credentials pass the normal bcrypt verification path and receive a Rector JWT', async () => {
  const rector = makeUser({ password: 'correct-password' });
  await withOverrides([[User, { findOne: () => ({ select: async () => rector }) }]], async () => {
    const result = await authService.loginUser('RECTOR@example.edu', 'correct-password');
    assert.equal(result.user.role, 'rector');
    assert.equal(jwt.verify(result.token, env.JWT_SECRET).id, rector._id);
  });
});

test('invalid Rector passwords are rejected', async () => {
  const rector = makeUser({ password: 'correct-password' });
  await withOverrides([[User, { findOne: () => ({ select: async () => rector }) }]], async () => {
    await assert.rejects(
      authService.loginUser('rector@example.edu', 'wrong-password'),
      (error) => error.statusCode === 401
    );
  });
});

test('the shared login service continues to authenticate valid Student credentials', async () => {
  const student = makeUser({ role: 'student', password: 'student-password' });
  await withOverrides([[User, { findOne: () => ({ select: async () => student }) }]], async () => {
    const result = await authService.loginUser('rector@example.edu', 'student-password');
    assert.equal(result.user.role, 'student');
    assert.equal(jwt.verify(result.token, env.JWT_SECRET).id, student._id);
  });
});

test('demo Rector login authenticates only the configured, marked Rector and assigned demo hostel', async () => {
  const previous = {
    email: env.DEMO_RECTOR_EMAIL,
    password: env.DEMO_RECTOR_PASSWORD,
    hostel: env.DEMO_HOSTEL_NAME
  };
  env.DEMO_RECTOR_EMAIL = 'demo@example.edu';
  env.DEMO_RECTOR_PASSWORD = 'a-secure-demo-password';
  env.DEMO_HOSTEL_NAME = 'FikrNot Demo Hostel';
  const demo = makeUser({
    email: env.DEMO_RECTOR_EMAIL,
    employeeId: authService.DEMO_RECTOR_EMPLOYEE_ID,
    password: env.DEMO_RECTOR_PASSWORD
  });
  try {
    await withOverrides([
      [User, {
        findOne: () => ({ select: async () => demo }),
        findById: async () => demo
      }],
      [Hostel, { findById: async () => ({ name: env.DEMO_HOSTEL_NAME }) }]
    ], async () => {
      const result = await authService.loginDemoRector();
      assert.equal(result.user.role, 'rector');
      assert.equal(jwt.verify(result.token, env.JWT_SECRET).id, demo._id);
    });
  } finally {
    env.DEMO_RECTOR_EMAIL = previous.email;
    env.DEMO_RECTOR_PASSWORD = previous.password;
    env.DEMO_HOSTEL_NAME = previous.hostel;
  }
});

test('demo credentials are disclosed only after the marked account and password are verified', async () => {
  const previous = [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD, env.DEMO_HOSTEL_NAME];
  env.DEMO_RECTOR_EMAIL = 'demo@example.edu';
  env.DEMO_RECTOR_PASSWORD = 'a-secure-demo-password';
  env.DEMO_HOSTEL_NAME = 'FikrNot Demo Hostel';
  const demo = makeUser({
    email: env.DEMO_RECTOR_EMAIL,
    employeeId: authService.DEMO_RECTOR_EMPLOYEE_ID,
    password: env.DEMO_RECTOR_PASSWORD
  });
  try {
    await withOverrides([
      [User, { findOne: () => ({ select: async () => demo }) }],
      [Hostel, { findById: async () => ({ name: env.DEMO_HOSTEL_NAME }) }]
    ], async () => {
      assert.deepEqual(await authService.getDemoRectorCredentials(), {
        email: env.DEMO_RECTOR_EMAIL,
        password: env.DEMO_RECTOR_PASSWORD
      });
    });
  } finally {
    [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD, env.DEMO_HOSTEL_NAME] = previous;
  }
});

test('demo credentials stay hidden when the configured email belongs to a non-demo account', async () => {
  const previous = [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD, env.DEMO_HOSTEL_NAME];
  env.DEMO_RECTOR_EMAIL = 'real-rector@example.edu';
  env.DEMO_RECTOR_PASSWORD = 'a-secure-demo-password';
  env.DEMO_HOSTEL_NAME = 'FikrNot Demo Hostel';
  const realRector = makeUser({
    email: env.DEMO_RECTOR_EMAIL,
    employeeId: 'REAL-RECTOR',
    password: env.DEMO_RECTOR_PASSWORD
  });
  try {
    await withOverrides([
      [User, { findOne: () => ({ select: async () => realRector }) }],
      [Hostel, { findById: async () => ({ name: env.DEMO_HOSTEL_NAME }) }]
    ], async () => {
      await assert.rejects(
        authService.getDemoRectorCredentials(),
        (error) => error.statusCode === 503
      );
    });
  } finally {
    [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD, env.DEMO_HOSTEL_NAME] = previous;
  }
});

test('demo login explains that server setup is required when demo secrets are missing', async () => {
  const previousEmail = env.DEMO_RECTOR_EMAIL;
  const previousPassword = env.DEMO_RECTOR_PASSWORD;
  env.DEMO_RECTOR_EMAIL = '';
  env.DEMO_RECTOR_PASSWORD = '';
  try {
    await assert.rejects(
      authService.loginDemoRector(),
      (error) =>
        error.statusCode === 503 &&
        error.diagnosticCode === 'DEMO_RECTOR_CONFIG_MISSING' &&
        /not configured on this server/i.test(error.message) &&
        /use your Rector credentials/i.test(error.message)
    );
  } finally {
    env.DEMO_RECTOR_EMAIL = previousEmail;
    env.DEMO_RECTOR_PASSWORD = previousPassword;
  }
});

test('demo login gives a safe unavailable response when no provisioned account exists', async () => {
  const previous = [env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD];
  env.DEMO_RECTOR_EMAIL = 'demo@example.edu';
  env.DEMO_RECTOR_PASSWORD = 'a-secure-demo-password';
  try {
    await withOverrides([[User, { findOne: () => ({ select: async () => null }) }]], async () => {
      await assert.rejects(
        authService.loginDemoRector(),
        (error) => error.statusCode === 503 &&
          error.diagnosticCode === 'DEMO_RECTOR_LOGIN_REJECTED' &&
          /unavailable/i.test(error.message)
      );
    });
  } finally {
    env.DEMO_RECTOR_EMAIL = previous[0];
    env.DEMO_RECTOR_PASSWORD = previous[1];
  }
});

test('public registration rejects the Rector role and service registration always creates a Student', async () => {
  const request = {
    body: {
      name: 'Public User', email: 'public@example.edu', password: 'password123',
      role: 'rector', hostelId: '65a000000000000000000002', studentId: 'STU-001'
    }
  };
  await Promise.all(registerValidator.map((validator) => validator.run(request)));
  assert.ok(validationResult(request).array().some((error) => error.path === 'role'));

  const created = [];
  const student = makeUser({ role: 'student', id: '65a000000000000000000003' });
  await withOverrides([
    [User, {
      findOne: async () => null,
      create: async (data) => { created.push(data); return student; }
    }],
    [Hostel, { findById: async () => ({ isActive: true }) }]
  ], async () => {
    const result = await authService.registerStudent({
      name: 'Public User', email: 'public@example.edu', password: 'password123',
      role: 'rector', hostelId: '65a000000000000000000002', studentId: 'STU-001'
    });
    assert.equal(result.user.role, 'student');
    assert.equal(created[0].role, 'student');
  });
});

test('Student tokens are denied Rector-only routes and Rectors cannot cross hostel scope', () => {
  let statusCode;
  let responseBody;
  const response = {
    status(code) { statusCode = code; return this; },
    json(body) { responseBody = body; return body; }
  };
  const middleware = authorize('rector');
  middleware({ user: { role: 'student' } }, response, () => assert.fail('must reject'));
  assert.equal(statusCode, 403);
  assert.equal(responseBody.success, false);
  assert.equal(
    verifyRectorHostelScope({ user: { role: 'rector', hostelId: 'hostel-a' } }, null, 'hostel-b'),
    false
  );
});

test('Rector found-report listings remain pinned to the assigned hostel despite a query override', async () => {
  let countFilter;
  let findFilter;
  const chain = {
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit: async () => []
  };
  await withOverrides([[
    FoundReport,
    {
      countDocuments: async (filter) => { countFilter = filter; return 0; },
      find: (filter) => { findFilter = filter; return chain; }
    }
  ]], async () => {
    await foundService.getFoundReports(
      { role: 'rector', hostelId: 'demo-hostel' },
      { hostelId: 'real-hostel', page: 1, limit: 10 }
    );
  });
  assert.equal(countFilter.hostelId, 'demo-hostel');
  assert.equal(findFilter.hostelId, 'demo-hostel');
});
