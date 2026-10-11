const crypto = require('node:crypto');
const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');
const { ROLES, LOST_STATUS, FOUND_STATUS } = require('../constants');
const authService = require('../services/auth/authService');
const { DEMO_RECTOR_EMPLOYEE_ID } = authService;

const DEMO_STUDENT_ID = 'DEMO-STUDENT-001';
const DEMO_STUDENT_EMAIL = 'sample.student@demo.invalid';
const DEMO_ITEMS = {
  lost: 'DEMO - Water bottle reported missing',
  awaitingCustody: 'DEMO - Key ring awaiting custody',
  withRector: 'DEMO - Library book in Rector custody'
};

const fail = (message) => {
  const error = new Error(message);
  error.statusCode = 1;
  throw error;
};

const sameId = (left, right) => left?.toString() === right?.toString();

async function provisionDemoRector() {
  const email = String(env.DEMO_RECTOR_EMAIL || '').trim().toLowerCase();
  const password = String(env.DEMO_RECTOR_PASSWORD || '');
  if (!email || !password) {
    fail('Set DEMO_RECTOR_EMAIL and DEMO_RECTOR_PASSWORD before provisioning.');
  }
  if (password.length < 6) {
    fail('DEMO_RECTOR_PASSWORD must satisfy the User model minimum of 6 characters.');
  }

  const rectorByMarker = await User.findOne({ employeeId: DEMO_RECTOR_EMPLOYEE_ID });
  const rectorByEmail = await User.findOne({ email });
  if (rectorByMarker && rectorByMarker.email !== email) {
    fail('A different account already uses the reserved Demo Rector marker. No changes were made.');
  }
  if (rectorByEmail && rectorByEmail.employeeId !== DEMO_RECTOR_EMPLOYEE_ID) {
    fail('The configured demo email already belongs to another account. No changes were made.');
  }
  if (rectorByMarker && rectorByMarker.role !== ROLES.RECTOR) {
    fail('The reserved Demo Rector marker belongs to a non-Rector account. No changes were made.');
  }
  if (
    rectorByMarker &&
    (rectorByMarker.name !== 'FikrNot Demo Rector' || rectorByMarker.designation !== 'Demo Rector')
  ) {
    fail('The reserved Demo Rector marker does not identify the designated demo account. No changes were made.');
  }

  let hostel = await Hostel.findOne({ name: env.DEMO_HOSTEL_NAME });
  if (rectorByMarker?.hostelId) {
    const assignedHostel = await Hostel.findById(rectorByMarker.hostelId);
    if (assignedHostel && assignedHostel.name !== env.DEMO_HOSTEL_NAME) {
      fail('The marked Demo Rector is assigned to another hostel. No changes were made.');
    }
  }
  if (hostel && hostel.rectorId && !sameId(hostel.rectorId, rectorByMarker?._id)) {
    fail('The reserved demo hostel is assigned to another account. No changes were made.');
  }
  if (hostel && !hostel.rectorId) {
    const [users, lostReports, foundReports] = await Promise.all([
      User.countDocuments({ hostelId: hostel._id }),
      LostReport.countDocuments({ hostelId: hostel._id }),
      FoundReport.countDocuments({ hostelId: hostel._id })
    ]);
    if (users || lostReports || foundReports) {
      fail('The reserved demo hostel already contains records. No changes were made.');
    }
  }

  if (rectorByMarker?.hostelId && hostel && !sameId(rectorByMarker.hostelId, hostel._id)) {
    fail('The marked Demo Rector is assigned to another hostel. No changes were made.');
  }

  if (!hostel) {
    hostel = await Hostel.create({
      name: env.DEMO_HOSTEL_NAME,
      capacity: 250,
      isActive: false,
      location: {
        type: 'Point',
        coordinates: [73.8567, 18.5204],
        area: 'Demo Campus'
      }
    });
  }

  let rector = rectorByMarker;
  if (rector) {
    rector.name = 'FikrNot Demo Rector';
    rector.email = email;
    rector.password = password;
    rector.designation = 'Demo Rector';
    rector.hostelId = hostel._id;
    rector.isActive = true;
    await rector.save();
  } else {
    rector = await User.create({
      name: 'FikrNot Demo Rector',
      email,
      password,
      role: ROLES.RECTOR,
      employeeId: DEMO_RECTOR_EMPLOYEE_ID,
      designation: 'Demo Rector',
      hostelId: hostel._id
    });
  }

  if (!sameId(hostel.rectorId, rector._id)) {
    hostel.rectorId = rector._id;
  }
  hostel.isActive = false;
  await hostel.save();

  let student = await User.findOne({ studentId: DEMO_STUDENT_ID });
  if (student) {
    if (
      student.role !== ROLES.STUDENT ||
      !sameId(student.hostelId, hostel._id) ||
      student.email !== DEMO_STUDENT_EMAIL
    ) {
      fail('The reserved demo student identifier is already in use. No changes were made.');
    }
  } else {
    const emailConflict = await User.findOne({ email: DEMO_STUDENT_EMAIL });
    if (emailConflict) {
      fail('The reserved demo student email is already in use. No changes were made.');
    }
    student = await User.create({
      name: 'Demo Sample Student',
      email: DEMO_STUDENT_EMAIL,
      password: crypto.randomBytes(32).toString('hex'),
      role: ROLES.STUDENT,
      studentId: DEMO_STUDENT_ID,
      hostelId: hostel._id,
      roomNumber: 'D-01'
    });
  }

  await ensureLostReport(student, hostel);
  await ensureFoundReport(student, rector, hostel, DEMO_ITEMS.awaitingCustody, FOUND_STATUS.REPORTED);
  await ensureFoundReport(student, rector, hostel, DEMO_ITEMS.withRector, FOUND_STATUS.WITH_RECTOR);

  // Exercise the exact login/JWT path used by both manual and quick demo sign-in.
  const verifiedLogin = await authService.loginDemoRector();
  if (verifiedLogin.user.email !== email || verifiedLogin.user.role !== ROLES.RECTOR) {
    fail('Demo Rector authentication verification failed after provisioning.');
  }

  return { email, hostelName: hostel.name, loginVerified: true };
}

async function ensureLostReport(student, hostel) {
  const existing = await LostReport.findOne({ hostelId: hostel._id, itemName: DEMO_ITEMS.lost });
  if (existing) {
    if (!sameId(existing.reportedBy, student._id)) {
      fail('A reserved demo lost report belongs to another account. No changes were made.');
    }
    existing.status = LOST_STATUS.ACTIVE;
    existing.cancellation = { isCancelled: false };
    await existing.save();
    return;
  }
  await LostReport.create({
    reportedBy: student._id,
    hostelId: hostel._id,
    category: 'Accessories',
    itemName: DEMO_ITEMS.lost,
    description: 'Sample record for evaluator walkthroughs.',
    location: { area: 'Demo Library' },
    status: LOST_STATUS.ACTIVE
  });
}

async function ensureFoundReport(student, rector, hostel, itemName, status) {
  const existing = await FoundReport.findOne({ hostelId: hostel._id, itemName });
  if (existing) {
    if (!sameId(existing.reportedBy, student._id)) {
      fail('A reserved demo found report belongs to another account. No changes were made.');
    }
    existing.status = status;
    existing.cancellation = { isCancelled: false };
    if (status === FOUND_STATUS.WITH_RECTOR) {
      existing.rectorId = rector._id;
      existing.receivedAt = new Date();
    } else {
      existing.rectorId = undefined;
      existing.receivedAt = undefined;
    }
    await existing.save();
    return;
  }
  await FoundReport.create({
    reportedBy: student._id,
    hostelId: hostel._id,
    category: itemName.includes('Key') ? 'Keys' : 'Books/Stationery',
    itemName,
    description: 'Sample record for evaluator walkthroughs.',
    location: { area: 'Demo Library' },
    status,
    ...(status === FOUND_STATUS.WITH_RECTOR
      ? { rectorId: rector._id, receivedAt: new Date() }
      : {})
  });
}

async function main() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const result = await provisionDemoRector();
  console.log(`Demo Rector provisioned for ${result.hostelName}.`);
  console.log('Authentication verified through the application login and JWT flow.');
  console.log(`Demo email: ${result.email}`);
  console.log('The password is read from DEMO_RECTOR_PASSWORD and is not printed.');
}

if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error.message);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState) await mongoose.disconnect();
    });
}

module.exports = { provisionDemoRector, DEMO_ITEMS };
