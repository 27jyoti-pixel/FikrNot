const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');
const Match = require('../models/Match');
const Claim = require('../models/Claim');
const Notification = require('../models/Notification');
const { calculateMatchScore } = require('../services/matching/matchingEngine');
const { isValidLostTransition, isValidFoundTransition, isValidClaimTransition } = require('../utils/statusTransitions');
const { ROLES, LOST_STATUS, FOUND_STATUS, CLAIM_STATUS, MATCH_STATUS } = require('../constants');
const migrateLocationIndexes = require('../config/migrateLocationIndexes');

let server;
let mongoServer;
const PORT = 5098;

const runTests = async () => {
  let passedCount = 0;
  let failedCount = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASSED: ${testName}`);
      passedCount++;
    } else {
      console.error(`  ❌ FAILED: ${testName}`);
      failedCount++;
    }
  };

  try {
    console.log('==================================================');
    console.log('🧪 RUNNING FIKRNOT BACKEND FINAL PRE-POSTMAN SUITE');
    console.log('==================================================');

    mongoServer = await MongoMemoryServer.create({
      binary: { version: '6.0.14' }
    });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('[TestDB] Connected to MongoMemoryServer.');

    for (const Model of [LostReport, FoundReport]) {
      await Model.init();
      const currentIndexes = await Model.collection.indexes();
      for (const index of currentIndexes.filter((item) => item.key?.location === '2dsphere')) {
        await Model.collection.dropIndex(index.name);
      }
      await Model.collection.createIndex({ location: '2dsphere' }, { name: 'location_2dsphere' });
    }
    await migrateLocationIndexes();
    for (const Model of [LostReport, FoundReport]) {
      const locationIndexes = await Model.collection.indexes();
      assert(
        locationIndexes.some((index) =>
          index.key?.location === '2dsphere' &&
          index.partialFilterExpression?.['location.coordinates']?.$exists === true
        ),
        `${Model.modelName} upgrades the existing 2dsphere index for manual locations`
      );
    }

    // Seed test hostels
    const hostel1 = await Hostel.create({
      name: 'Shivaji Hostel',
      capacity: 250,
      location: { type: 'Point', coordinates: [73.8567, 18.5204], area: 'West Campus Block A' }
    });

    const hostel2 = await Hostel.create({
      name: 'Tagore Hostel',
      capacity: 200,
      location: { type: 'Point', coordinates: [73.858, 18.522], area: 'East Campus Block B' }
    });

    // Seed Rectors
    const rector1 = await User.create({
      name: 'Dr. Suresh Deshmukh',
      email: 'rector.shivaji@fikrnot.edu',
      password: 'Rector123!',
      phone: '9876543210',
      role: ROLES.RECTOR,
      employeeId: 'EMP-SHIV-01',
      hostelId: hostel1._id
    });

    const rector2 = await User.create({
      name: 'Prof. Anjali Verma',
      email: 'rector.tagore@fikrnot.edu',
      password: 'Rector123!',
      phone: '9876543220',
      role: ROLES.RECTOR,
      employeeId: 'EMP-TAG-02',
      hostelId: hostel2._id
    });

    hostel1.rectorId = rector1._id;
    await hostel1.save();

    hostel2.rectorId = rector2._id;
    await hostel2.save();

    // Seed Students
    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul.sharma@fikrnot.edu',
      password: 'Student123!',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-001',
      hostelId: hostel1._id
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya.patel@fikrnot.edu',
      password: 'Student123!',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-002',
      hostelId: hostel1._id
    });

    const student3 = await User.create({
      name: 'Amit Kumar',
      email: 'amit.kumar@fikrnot.edu',
      password: 'Student123!',
      role: ROLES.STUDENT,
      studentId: 'STU-2024-003',
      hostelId: hostel2._id
    });

    server = app.listen(PORT, () => {
      console.log(`[TestServer] Test server running on port ${PORT}`);
    });

    const baseUrl = `http://localhost:${PORT}/api`;

    // Auth Tokens
    const getToken = async (email, password) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      return data.data.token;
    };

    const s1Token = await getToken('rahul.sharma@fikrnot.edu', 'Student123!');
    const s2Token = await getToken('priya.patel@fikrnot.edu', 'Student123!');
    const s3Token = await getToken('amit.kumar@fikrnot.edu', 'Student123!');
    const r1Token = await getToken('rector.shivaji@fikrnot.edu', 'Rector123!');
    const r2Token = await getToken('rector.tagore@fikrnot.edu', 'Rector123!');

    const [studentIdentityRes, rectorIdentityRes] = await Promise.all([
      fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${s1Token}` } }),
      fetch(`${baseUrl}/auth/me`, { headers: { Authorization: `Bearer ${r1Token}` } })
    ]);
    const [studentIdentity, rectorIdentity] = await Promise.all([
      studentIdentityRes.json(),
      rectorIdentityRes.json()
    ]);
    assert(studentIdentity.data?.user?.role === ROLES.STUDENT, 'Student login resolves the authenticated student role');
    assert(rectorIdentity.data?.user?.role === ROLES.RECTOR, 'Rector login resolves the authenticated Rector role');
    const [studentRectorAreaRes, rectorAreaRes, logoutRes] = await Promise.all([
      fetch(`${baseUrl}/analytics/rector`, { headers: { Authorization: `Bearer ${s1Token}` } }),
      fetch(`${baseUrl}/analytics/rector`, { headers: { Authorization: `Bearer ${r1Token}` } }),
      fetch(`${baseUrl}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${s2Token}` } })
    ]);
    assert(studentRectorAreaRes.status === 403, 'Student role is denied Rector-only backend routes');
    assert(rectorAreaRes.status === 200, 'Rector role can access Rector-only backend routes');
    assert(logoutRes.status === 200, 'Authenticated logout endpoint remains functional');

    console.log('\n--- ROUTE MOUNTING & AUTH GUARD SMOKE AUDIT ---');
    const routeSmokeCases = [
      ['POST', '/auth/register', 400, {}],
      ['POST', '/auth/login', 400, {}],
      ['GET', '/auth/me', 401],
      ['POST', '/auth/logout', 401],
      ['GET', '/users/me', 401],
      ['PUT', '/users/me', 401],
      ['GET', '/users', 401],
      ['GET', `/users/${student1._id}`, 401],
      ['PUT', `/users/${student1._id}/status`, 401],
      ['GET', '/hostels', 200],
      ['GET', '/hostels/me', 401],
      ['GET', `/hostels/${hostel1._id}`, 401],
      ['POST', '/lost', 401],
      ['GET', '/lost', 401],
      ['GET', `/lost/${student1._id}`, 401],
      ['PUT', `/lost/${student1._id}`, 401],
      ['PUT', `/lost/${student1._id}/cancel`, 401],
      ['DELETE', `/lost/${student1._id}`, 401],
      ['PUT', `/lost/${student1._id}/moderate`, 401],
      ['POST', '/found', 401],
      ['GET', '/found', 401],
      ['GET', `/found/${student1._id}`, 401],
      ['PUT', `/found/${student1._id}`, 401],
      ['PUT', `/found/${student1._id}/receive`, 401],
      ['PUT', `/found/${student1._id}/status`, 401],
      ['PUT', `/found/${student1._id}/cancel`, 401],
      ['DELETE', `/found/${student1._id}`, 401],
      ['PUT', `/found/${student1._id}/moderate`, 401],
      ['GET', `/matches/lost/${student1._id}`, 401],
      ['GET', `/matches/found/${student1._id}`, 401],
      ['POST', '/claims', 401],
      ['GET', '/claims/my', 401],
      ['GET', `/claims/${student1._id}`, 401],
      ['PUT', `/claims/${student1._id}/evidence`, 401],
      ['PUT', `/claims/${student1._id}/withdraw`, 401],
      ['PUT', `/claims/${student1._id}/review`, 401],
      ['PUT', `/claims/${student1._id}/request-information`, 401],
      ['PUT', `/recovery/${student1._id}/confirm`, 401],
      ['PUT', `/recovery/${student1._id}/complete`, 401],
      ['GET', '/notifications', 401],
      ['PUT', `/notifications/${student1._id}/read`, 401],
      ['PUT', '/notifications/read-all', 401],
      ['GET', '/analytics/student', 401],
      ['GET', '/analytics/rector', 401],
      ['GET', '/health', 200]
    ];

    for (const [method, path, expectedStatus, body] of routeSmokeCases) {
      const options = { method };
      if (body !== undefined) {
        options.headers = { 'Content-Type': 'application/json' };
        options.body = JSON.stringify(body);
      }
      const response = await fetch(`${baseUrl}${path}`, options);
      assert(
        response.status === expectedStatus,
        `${method} /api${path} is mounted and returns ${expectedStatus} without authentication`
      );
    }

    console.log('\n--- LOST REPORT UPDATE CONTRACT ---');
    const updateTargetRes = await fetch(`${baseUrl}/lost`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s1Token}`
      },
      body: JSON.stringify({
        category: 'Electronics',
        itemName: 'Update contract test item',
        location: {
          coordinates: [73.8567, 18.5204],
          area: 'Test Hall'
        }
      })
    });
    const updateTargetBody = await updateTargetRes.json();
    const updateTargetId = updateTargetBody.data?._id;
    assert(
      updateTargetRes.status === 201 && updateTargetId,
      'Lost update fixture can be created'
    );

    const updateForm = new FormData();
    updateForm.append('itemName', 'Updated test item');
    updateForm.append('category', 'Books/Stationery');
    updateForm.append('brand', 'Audit');
    updateForm.append('color', 'Blue');
    updateForm.append('description', 'Updated using the frontend multipart contract.');
    updateForm.append('location[area]', 'Updated Hall');
    updateForm.append('location[coordinates][0]', '73.857');
    updateForm.append('location[coordinates][1]', '18.521');
    updateForm.append('lostAt', '2026-10-05');

    const updateLostRes = await fetch(`${baseUrl}/lost/${updateTargetId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: updateForm
    });
    const updateLostBody = await updateLostRes.json();
    assert(
      updateLostRes.status === 200,
      `PUT /lost/:id accepts the frontend multipart payload (got ${updateLostRes.status}: ${updateLostBody.message || 'no message'})`
    );
    assert(
      updateLostBody.success === true &&
        updateLostBody.data?.itemName === 'Updated test item' &&
        updateLostBody.data?.location?.area === 'Updated Hall' &&
        updateLostBody.data?.location?.coordinates?.[0] === 73.857 &&
        updateLostBody.data?.location?.type === 'Point',
      'PUT /lost/:id persists fields and valid GeoJSON in the expected response shape'
    );

    const updateFoundTargetRes = await fetch(`${baseUrl}/found`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${s1Token}`
      },
      body: JSON.stringify({
        category: 'Keys',
        itemName: 'Found update contract item',
        location: {
          coordinates: [73.8567, 18.5204],
          area: 'Found Test Hall'
        }
      })
    });
    const updateFoundTargetBody = await updateFoundTargetRes.json();
    const updateFoundTargetId = updateFoundTargetBody.data?._id;
    const updateFoundForm = new FormData();
    updateFoundForm.append('itemName', 'Updated found item');
    updateFoundForm.append('category', 'Keys');
    updateFoundForm.append('location[area]', 'Updated Found Hall');
    updateFoundForm.append('location[coordinates][0]', '73.857');
    updateFoundForm.append('location[coordinates][1]', '18.521');

    const updateFoundRes = await fetch(`${baseUrl}/found/${updateFoundTargetId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` },
      body: updateFoundForm
    });
    const updateFoundBody = await updateFoundRes.json();
    assert(
      updateFoundTargetRes.status === 201 && updateFoundRes.status === 200,
      `PUT /found/:id accepts the frontend multipart payload (got ${updateFoundRes.status}: ${updateFoundBody.message || 'no message'})`
    );
    assert(
      updateFoundBody.data?.itemName === 'Updated found item' &&
        updateFoundBody.data?.location?.type === 'Point',
      'PUT /found/:id persists location as valid GeoJSON'
    );

    console.log('\n--- MANUAL LOCATION CREATE & UPDATE CONTRACT ---');
    const manualLostCreateForm = new FormData();
    manualLostCreateForm.append('category', 'Books/Stationery');
    manualLostCreateForm.append('itemName', 'Manual location lost item');
    manualLostCreateForm.append('location[area]', 'Central Canteen, Parul University');
    const manualLostCreateRes = await fetch(`${baseUrl}/lost`, {
      method: 'POST', headers: { Authorization: `Bearer ${s1Token}` }, body: manualLostCreateForm
    });
    const manualLostCreated = await manualLostCreateRes.json();
    assert(
      manualLostCreateRes.status === 201 &&
        manualLostCreated.data?.location?.area === 'Central Canteen, Parul University' &&
        !manualLostCreated.data?.location?.coordinates,
      'POST /lost accepts manual location without invented coordinates'
    );
    const manualLostUpdateForm = new FormData();
    manualLostUpdateForm.append('location[area]', 'Library');
    const manualLostUpdateRes = await fetch(`${baseUrl}/lost/${manualLostCreated.data?._id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${s1Token}` }, body: manualLostUpdateForm
    });
    const manualLostUpdated = await manualLostUpdateRes.json();
    assert(
      manualLostUpdateRes.status === 200 && manualLostUpdated.data?.location?.area === 'Library' &&
        !manualLostUpdated.data?.location?.coordinates && !manualLostUpdated.data?.location?.type,
      'PUT /lost/:id preserves manual-only location without malformed GeoJSON'
    );

    const manualFoundCreateForm = new FormData();
    manualFoundCreateForm.append('category', 'Accessories');
    manualFoundCreateForm.append('itemName', 'Manual location found item');
    manualFoundCreateForm.append('location[area]', 'Near Main Gate');
    const manualFoundCreateRes = await fetch(`${baseUrl}/found`, {
      method: 'POST', headers: { Authorization: `Bearer ${s1Token}` }, body: manualFoundCreateForm
    });
    const manualFoundCreated = await manualFoundCreateRes.json();
    assert(
      manualFoundCreateRes.status === 201 &&
        manualFoundCreated.data?.location?.area === 'Near Main Gate' &&
        !manualFoundCreated.data?.location?.coordinates,
      'POST /found accepts manual location without invented coordinates'
    );
    const manualFoundUpdateForm = new FormData();
    manualFoundUpdateForm.append('location[area]', 'Food Court');
    const manualFoundUpdateRes = await fetch(`${baseUrl}/found/${manualFoundCreated.data?._id}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${s1Token}` }, body: manualFoundUpdateForm
    });
    const manualFoundUpdated = await manualFoundUpdateRes.json();
    assert(
      manualFoundUpdateRes.status === 200 && manualFoundUpdated.data?.location?.area === 'Food Court' &&
        !manualFoundUpdated.data?.location?.coordinates && !manualFoundUpdated.data?.location?.type,
      'PUT /found/:id preserves manual-only location without malformed GeoJSON'
    );
    const invalidCoordinatesRes = await fetch(`${baseUrl}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({
        category: 'Electronics', itemName: 'Invalid coordinates test',
        location: { area: 'Campus', coordinates: [73.36, 181] }
      })
    });
    assert(invalidCoordinatesRes.status === 400, 'Invalid latitude is rejected before reaching the geospatial index');

    await LostReport.updateOne(
      { _id: updateTargetId },
      { $set: { images: [{ url: 'http://localhost/uploads/img_removed_lost.jpg', publicId: 'local_img_removed_lost.jpg' }] } }
    );
    const removeLostImageForm = new FormData();
    removeLostImageForm.append('removeImageIds', JSON.stringify(['local_img_removed_lost.jpg']));
    const removeLostImageRes = await fetch(`${baseUrl}/lost/${updateTargetId}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${s1Token}` }, body: removeLostImageForm
    });
    const removeLostImageBody = await removeLostImageRes.json();
    assert(
      removeLostImageRes.status === 200 && removeLostImageBody.data?.images?.length === 0,
      'PUT /lost/:id removes a selected existing image'
    );

    await FoundReport.updateOne(
      { _id: updateFoundTargetId },
      { $set: { images: [{ url: 'http://localhost/uploads/img_removed_found.jpg', publicId: 'local_img_removed_found.jpg' }] } }
    );
    const removeFoundImageForm = new FormData();
    removeFoundImageForm.append('removeImageIds', JSON.stringify(['local_img_removed_found.jpg']));
    const removeFoundImageRes = await fetch(`${baseUrl}/found/${updateFoundTargetId}`, {
      method: 'PUT', headers: { Authorization: `Bearer ${s1Token}` }, body: removeFoundImageForm
    });
    const removeFoundImageBody = await removeFoundImageRes.json();
    assert(
      removeFoundImageRes.status === 200 && removeFoundImageBody.data?.images?.length === 0,
      'PUT /found/:id removes a selected existing image'
    );

    console.log('\n--- FRONTEND RESPONSE CONTRACTS ---');
    const [lostListRes, foundListRes, lostDetailRes, foundDetailRes] =
      await Promise.all([
        fetch(`${baseUrl}/lost?itemName=Updated`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        }),
        fetch(`${baseUrl}/found?search=Updated`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        }),
        fetch(`${baseUrl}/lost/${updateTargetId}`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        }),
        fetch(`${baseUrl}/found/${updateFoundTargetId}`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        })
      ]);
    const [lostListBody, foundListBody, lostDetailBody, foundDetailBody] =
      await Promise.all([
        lostListRes.json(),
        foundListRes.json(),
        lostDetailRes.json(),
        foundDetailRes.json()
      ]);
    assert(
      lostListRes.status === 200 &&
        Array.isArray(lostListBody.data) &&
        typeof lostListBody.pagination?.total === 'number',
      'GET /lost returns data[] and pagination expected by Browse and StudentDashboard'
    );
    assert(
      foundListRes.status === 200 &&
        Array.isArray(foundListBody.data) &&
        typeof foundListBody.pagination?.total === 'number',
      'GET /found returns data[] and pagination expected by Browse and StudentDashboard'
    );
    assert(
      lostDetailRes.status === 200 &&
        lostDetailBody.data?._id === updateTargetId,
      'GET /lost/:id returns the report object expected by the frontend'
    );
    assert(
      foundDetailRes.status === 200 &&
        foundDetailBody.data?._id === updateFoundTargetId,
      'GET /found/:id returns the report object expected by the frontend'
    );

    const [hostelsRes, myHostelRes, authMeRes, profileRes, usersRes] =
      await Promise.all([
        fetch(`${baseUrl}/hostels`),
        fetch(`${baseUrl}/hostels/me`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        }),
        fetch(`${baseUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        }),
        fetch(`${baseUrl}/users/me`, {
          headers: { Authorization: `Bearer ${s1Token}` }
        }),
        fetch(`${baseUrl}/users`, {
          headers: { Authorization: `Bearer ${r1Token}` }
        })
      ]);
    const [hostelsBody, myHostelBody, authMeBody, profileBody, usersBody] =
      await Promise.all([
        hostelsRes.json(),
        myHostelRes.json(),
        authMeRes.json(),
        profileRes.json(),
        usersRes.json()
      ]);
    assert(
      hostelsRes.status === 200 &&
        Array.isArray(hostelsBody.data) &&
        hostelsBody.data.every((hostel) => hostel._id && hostel.name),
      'GET /hostels returns selectable MongoDB IDs and names'
    );
    assert(
      myHostelRes.status === 200 && myHostelBody.data?._id === String(hostel1._id),
      'GET /hostels/me returns the assigned hostel object'
    );
    assert(
      authMeRes.status === 200 && authMeBody.data?.user?._id === String(student1._id),
      'GET /auth/me returns data.user consumed by AuthContext'
    );
    assert(
      profileRes.status === 200 && profileBody.data?.user?._id === String(student1._id),
      'GET /users/me returns data.user consumed by the profile screen'
    );
    assert(
      usersRes.status === 200 &&
        Array.isArray(usersBody.data) &&
        typeof usersBody.pagination?.total === 'number',
      'GET /users returns a paginated list consumed by the Rector dashboard'
    );

    const wrongOwnerUpdateRes = await fetch(`${baseUrl}/lost/${updateTargetId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s2Token}` },
      body: new FormData()
    });
    assert(
      wrongOwnerUpdateRes.status === 403,
      'PUT /lost/:id rejects a non-owner'
    );

    console.log('\n--- 1. LOCKED STATUS TRANSITIONS ---');
    assert(isValidLostTransition('ACTIVE', 'MATCH_FOUND') === true, 'Lost ACTIVE -> MATCH_FOUND is valid');
    assert(isValidLostTransition('ACTIVE', 'CLAIM_IN_PROGRESS') === false, 'Lost ACTIVE -> CLAIM_IN_PROGRESS shortcut is rejected');
    assert(isValidFoundTransition('REPORTED', 'AWAITING_HANDOVER') === true, 'Found REPORTED -> AWAITING_HANDOVER is valid');
    assert(isValidFoundTransition('REPORTED', 'WITH_RECTOR') === false, 'Found REPORTED -> WITH_RECTOR shortcut is rejected');

    console.log('\n--- 2. DELETE ENDPOINTS & AUTHORIZATION ---');
    // Create Lost report by Student 1
    const l1Res = await fetch(`${baseUrl}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({
        category: 'Electronics',
        itemName: 'Samsung Galaxy Watch',
        brand: 'Samsung',
        color: 'Black',
        location: { coordinates: [73.8567, 18.5204], area: 'Corridor' }
      })
    });
    const l1Data = await l1Res.json();
    const l1Id = l1Data.data._id;

    // Test: wrong-owner delete -> 403
    const delWrongRes = await fetch(`${baseUrl}/lost/${l1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${s3Token}` }
    });
    assert(delWrongRes.status === 403, '3. wrong-owner delete returns 403 Forbidden');

    // Test: DELETE lost report by owner -> 200
    const delRes = await fetch(`${baseUrl}/lost/${l1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(delRes.status === 200, '1. DELETE lost report by owner succeeds with 200');

    // Create Found report by Student 1
    const f1Res = await fetch(`${baseUrl}/found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({
        category: 'Keys',
        itemName: 'Bike Key',
        location: { coordinates: [73.8567, 18.5204], area: 'Parking' }
      })
    });
    const f1Data = await f1Res.json();
    const f1Id = f1Data.data._id;

    // Test: DELETE found report by owner -> 200
    const delFoundRes = await fetch(`${baseUrl}/found/${f1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(delFoundRes.status === 200, '2. DELETE found report by owner succeeds with 200');

    console.log('\n--- 3. CANCEL WORKFLOW & INELIGIBILITY ---');
    // Create eligible Lost report
    const l2Res = await fetch(`${baseUrl}/lost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({
        category: 'Bags',
        itemName: 'Nike Duffle Bag',
        location: { coordinates: [73.8567, 18.5204], area: 'Gym' }
      })
    });
    const l2Id = (await l2Res.json()).data._id;

    // Test 5: eligible Lost cancel works
    const cancelL2Res = await fetch(`${baseUrl}/lost/${l2Id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(cancelL2Res.status === 200, '5. eligible Lost cancel works with 200');

    // Create eligible Found report
    const f2Res = await fetch(`${baseUrl}/found`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({
        category: 'Bags',
        itemName: 'Found Duffle Bag',
        location: { coordinates: [73.8567, 18.5204], area: 'Gym' }
      })
    });
    const f2Id = (await f2Res.json()).data._id;

    // Test 6: eligible Found cancel works
    const cancelF2Res = await fetch(`${baseUrl}/found/${f2Id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(cancelF2Res.status === 200, '6. eligible Found cancel works with 200');

    // Test 7 & 8: Progressed reports cancellation / deletion rejection
    // Manually progress a lost report to CLAIM_IN_PROGRESS
    const lProgressed = await LostReport.create({
      reportedBy: student1._id,
      hostelId: hostel1._id,
      category: 'Electronics',
      itemName: 'Laptop Progressed',
      location: { type: 'Point', coordinates: [73.8567, 18.5204], area: 'Library' },
      status: LOST_STATUS.CLAIM_IN_PROGRESS
    });

    const cancelProgLRes = await fetch(`${baseUrl}/lost/${lProgressed._id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(cancelProgLRes.status === 400, '7. cancelling a progressed Lost report returns 400');

    const delIneligibleLRes = await fetch(`${baseUrl}/lost/${lProgressed._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(delIneligibleLRes.status === 400, '4. deleting ineligible report returns 400');

    const fProgressed = await FoundReport.create({
      reportedBy: student1._id,
      hostelId: hostel1._id,
      category: 'Electronics',
      itemName: 'Laptop Progressed Found',
      location: { type: 'Point', coordinates: [73.8567, 18.5204], area: 'Library' },
      status: FOUND_STATUS.WITH_RECTOR
    });

    const cancelProgFRes = await fetch(`${baseUrl}/found/${fProgressed._id}/cancel`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(cancelProgFRes.status === 400, '8. cancelling a progressed Found report returns 400');

    console.log('\n--- 4. RECOVERY SEQUENCE WORKFLOW ---');
    // Setup valid Recovery test sequence:
    // 1. FoundReport is WITH_RECTOR -> CLAIM_IN_PROGRESS upon Claim Approval
    const fRec = await FoundReport.create({
      reportedBy: student2._id,
      hostelId: hostel1._id,
      category: 'Electronics',
      itemName: 'MacBook Air M2',
      brand: 'Apple',
      color: 'Space Grey',
      location: { type: 'Point', coordinates: [73.8567, 18.5204], area: 'Reading Room' },
      status: FOUND_STATUS.WITH_RECTOR,
      rectorId: rector1._id,
      receivedAt: new Date()
    });

    const lRec = await LostReport.create({
      reportedBy: student1._id,
      hostelId: hostel1._id,
      category: 'Electronics',
      itemName: 'MacBook Air M2',
      brand: 'Apple',
      color: 'Space Grey',
      location: { type: 'Point', coordinates: [73.8567, 18.5204], area: 'Reading Room' },
      status: LOST_STATUS.MATCH_FOUND
    });

    const matchRec = await Match.create({
      lostReportId: lRec._id,
      foundReportId: fRec._id,
      matchScore: 90,
      status: MATCH_STATUS.ACTIVE
    });

    // Student 1 submits claim
    const claimRes = await fetch(`${baseUrl}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s1Token}` },
      body: JSON.stringify({
        foundReportId: fRec._id,
        lostReportId: lRec._id,
        evidence: 'Serial C02XXXXX. Sticker of Python logo.'
      })
    });
    const claimId = (await claimRes.json()).data._id;

    // Rector 1 reviews and approves claim -> sets Found & Lost to CLAIM_IN_PROGRESS
    await Claim.findByIdAndUpdate(claimId, { status: CLAIM_STATUS.UNDER_VERIFICATION });
    const approveRes = await fetch(`${baseUrl}/claims/${claimId}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${r1Token}` },
      body: JSON.stringify({ status: CLAIM_STATUS.APPROVED })
    });
    assert(approveRes.status === 200, 'Rector approves claim cleanly');

    // Test 14: wrong student recovery confirmation -> 403
    const wrongStudentConfRes = await fetch(`${baseUrl}/recovery/${claimId}/confirm`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s3Token}` }
    });
    assert(wrongStudentConfRes.status === 403, '14. wrong student recovery confirmation returns 403');

    // Test 11 before 9/10: Rector completion before student confirmation -> 400
    const prematureRectorCompRes = await fetch(`${baseUrl}/recovery/${claimId}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${r1Token}` }
    });
    assert(prematureRectorCompRes.status === 400, 'Rector completion before student confirmation is rejected with 400');

    // Test 9 & 10: Student recovery confirmation succeeds & records actor/timestamp
    const studentConfRes = await fetch(`${baseUrl}/recovery/${claimId}/confirm`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${s1Token}` }
    });
    assert(studentConfRes.status === 200, '9. student recovery confirmation succeeds with 200');

    const updatedClaimAfterStudent = await Claim.findById(claimId);
    assert(
      updatedClaimAfterStudent.studentConfirmedAt && updatedClaimAfterStudent.studentConfirmedBy.toString() === student1._id.toString(),
      '10. student recovery confirmation records actor and timestamp'
    );

    // Test 15: wrong-hostel Rector completion -> 403
    const wrongRectorCompRes = await fetch(`${baseUrl}/recovery/${claimId}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${r2Token}` }
    });
    assert(wrongRectorCompRes.status === 403, '15. wrong-hostel Rector completion returns 403');

    // Test 11, 12, 13: Rector completion succeeds after student confirmation
    const rectorCompRes = await fetch(`${baseUrl}/recovery/${claimId}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${r1Token}` }
    });
    assert(rectorCompRes.status === 200, '11. Rector completion succeeds after student confirmation with 200');

    const finalFound = await FoundReport.findById(fRec._id);
    const finalLost = await LostReport.findById(lRec._id);
    const finalMatch = await Match.findById(matchRec._id);

    assert(finalFound.status === FOUND_STATUS.RETURNED, '12a. Final Found lifecycle status is RETURNED');
    assert(finalLost.status === LOST_STATUS.RECOVERED, '12b. Final Lost lifecycle status is RECOVERED');
    assert(finalMatch.status === MATCH_STATUS.RESOLVED, '13. Match becomes RESOLVED');

    // Test 16: invalid recovery state on already completed claim -> 400
    const invalidStateRes = await fetch(`${baseUrl}/recovery/${claimId}/complete`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${r1Token}` }
    });
    assert(invalidStateRes.status === 400, '16. invalid recovery state returns 400');

    console.log('\n==================================================');
    console.log(`📊 FINAL PRE-POSTMAN SUITE SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log('==================================================');

    if (failedCount === 0) {
      console.log('✨ ALL 16 FOCUSED TEST REQUIREMENTS PASSED 100% PERFECTLY!');
    }

    server.close();
    await mongoose.connection.close();
    await mongoServer.stop();
    process.exit(failedCount === 0 ? 0 : 1);
  } catch (error) {
    console.error('❌ [Test Suite Exception]', error);
    if (server) server.close();
    if (mongoServer) await mongoServer.stop();
    await mongoose.connection.close();
    process.exit(1);
  }
};

runTests();
