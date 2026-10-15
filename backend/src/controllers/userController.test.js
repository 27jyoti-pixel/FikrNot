const assert = require('node:assert/strict');
const test = require('node:test');
const User = require('../models/User');
const userController = require('./userController');
const foundService = require('../services/found/foundService');
const lostService = require('../services/lost/lostService');

const invoke = (handler, req) => new Promise((resolve, reject) => {
  const res = {
    status(code) { this.statusCode = code; return this; },
    json(body) { resolve({ statusCode: this.statusCode, body }); }
  };
  handler(req, res, reject);
});

test('Rector student summary aggregates only students from the assigned hostel', async () => {
  const originalCount = User.countDocuments;
  const originalDistinct = User.distinct;
  const countFilters = [];
  const distinctFilters = [];
  User.countDocuments = async (filter) => {
    countFilters.push(filter);
    return filter.createdAt ? 3 : 24;
  };
  User.distinct = async (field, filter) => {
    distinctFilters.push({ field, filter });
    return field === 'course' ? ['Computer Science'] : field === 'department' ? ['Engineering'] : [1, 2];
  };
  try {
    const { statusCode, body } = await invoke(userController.getRectorStudentSummary, {
      user: { role: 'rector', hostelId: 'hostel-1' }
    });
    assert.equal(statusCode, 200);
    assert.deepEqual(body.data, {
      total: 24,
      newThisMonth: 3,
      courses: ['Computer Science'],
      departments: ['Engineering'],
      years: [1, 2]
    });
    assert.ok(countFilters.every((filter) => filter.role === 'student' && filter.hostelId === 'hostel-1'));
    assert.ok(distinctFilters.every(({ filter }) => filter.role === 'student' && filter.hostelId === 'hostel-1'));
    assert.ok(countFilters[1].createdAt.$gte < countFilters[1].createdAt.$lt);
  } finally {
    User.countDocuments = originalCount;
    User.distinct = originalDistinct;
  }
});

test('Rector student summary refuses an unassigned Rector without querying users', async () => {
  const originalCount = User.countDocuments;
  let queried = false;
  User.countDocuments = async () => { queried = true; return 0; };
  try {
    const { statusCode, body } = await invoke(userController.getRectorStudentSummary, {
      user: { role: 'rector', hostelId: null }
    });
    assert.equal(statusCode, 403);
    assert.equal(body.success, false);
    assert.equal(queried, false);
  } finally {
    User.countDocuments = originalCount;
  }
});

test('Rector student listing applies supported filters within the assigned hostel', async () => {
  const originalCount = User.countDocuments;
  const originalFind = User.find;
  let countFilter;
  let findFilter;
  let appliedSort;
  User.countDocuments = async (filter) => { countFilter = filter; return 1; };
  User.find = (filter) => {
    findFilter = filter;
    const query = {
      select() { return this; },
      sort(value) { appliedSort = value; return this; },
      skip(value) { this.skipValue = value; return this; },
      limit: async () => [{ _id: 'student-1' }]
    };
    return query;
  };
  try {
    const { statusCode, body } = await invoke(userController.getUsers, {
      user: { role: 'rector', hostelId: 'hostel-1' },
      query: {
        page: '2', limit: '20', search: 'Riya', course: 'B.Tech',
        department: 'Engineering', year: '2', isActive: 'false',
        sortBy: 'createdAt', sortOrder: 'desc'
      }
    });
    assert.equal(statusCode, 200);
    assert.equal(body.data[0]._id, 'student-1');
    assert.deepEqual(findFilter, {
      hostelId: 'hostel-1', role: 'student', course: 'B.Tech',
      department: 'Engineering', year: 2, isActive: false,
      $or: [
        { name: { $regex: 'Riya', $options: 'i' } },
        { studentId: { $regex: 'Riya', $options: 'i' } },
        { email: { $regex: 'Riya', $options: 'i' } }
      ]
    });
    assert.deepEqual(countFilter, findFilter);
    assert.deepEqual(appliedSort, { createdAt: -1, _id: -1 });
    assert.deepEqual(body.pagination, { page: 2, limit: 20, total: 1, totalPages: 1 });
  } finally {
    User.countDocuments = originalCount;
    User.find = originalFind;
  }
});

test('unassigned Rectors cannot list reports through the hostel-scoped report APIs', async () => {
  await assert.rejects(foundService.getFoundReports({ role: 'rector' }), (error) => error.statusCode === 403);
  await assert.rejects(lostService.getLostReports({ role: 'rector' }), (error) => error.statusCode === 403);
});

test('Rector profile updates are rejected before loading or changing any user', async () => {
  const originalFindById = User.findById;
  let queried = false;
  User.findById = async () => { queried = true; throw new Error('Unexpected user lookup'); };
  try {
    const { statusCode, body } = await invoke(userController.updateMyProfile, {
      user: { _id: 'rector-1', role: 'rector' },
      body: { name: 'Changed name', course: 'Changed course' },
      uploadedImages: []
    });
    assert.equal(statusCode, 403);
    assert.equal(body.success, false);
    assert.equal(queried, false);
  } finally {
    User.findById = originalFindById;
  }
});

test('students can still update their own permitted profile fields', async () => {
  const originalFindById = User.findById;
  const student = {
    role: 'student',
    name: 'Old name',
    async save() { this.saved = true; }
  };
  User.findById = async (id) => id === 'student-1' ? student : null;
  try {
    const { statusCode, body } = await invoke(userController.updateMyProfile, {
      user: { _id: 'student-1', role: 'student' },
      body: { name: 'Updated name' },
      uploadedImages: []
    });
    assert.equal(statusCode, 200);
    assert.equal(student.name, 'Updated name');
    assert.equal(student.saved, true);
    assert.equal(body.data.user.name, 'Updated name');
  } finally {
    User.findById = originalFindById;
  }
});

test('Rector student profile projection includes contact and room details but excludes private family fields', async () => {
  const originalFindById = User.findById;
  let lookupCount = 0;
  let projection;
  User.findById = (id) => {
    lookupCount += 1;
    if (lookupCount === 1) return Promise.resolve({ _id: id, role: 'student', hostelId: 'hostel-1' });
    return {
      select(fields) { projection = fields; return this; },
      populate: async () => ({ phone: '555-0100', roomNumber: 'B-203' })
    };
  };
  try {
    const { statusCode, body } = await invoke(userController.getUserById, {
      user: { _id: 'rector-1', role: 'rector', hostelId: 'hostel-1' },
      params: { id: 'student-1' }
    });
    assert.equal(statusCode, 200);
    assert.equal(body.data.user.phone, '555-0100');
    assert.equal(body.data.user.roomNumber, 'B-203');
    assert.equal(projection, '-parentGuardian -emergencyContact -address');
  } finally {
    User.findById = originalFindById;
  }
});
