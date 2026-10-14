const mongoose = require('mongoose');
const env = require('../config/env');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const LostReport = require('../models/LostReport');
const FoundReport = require('../models/FoundReport');
const { ROLES } = require('../constants');
const authService = require('../services/auth/authService');
const { DEMO_RECTOR_EMPLOYEE_ID } = authService;

const DEMO_RECTOR_NAME = 'FikrNot Demo Rector';
const DEMO_RECTOR_DESIGNATION = 'Demo Rector';

const fail = (message) => {
  const error = new Error(message);
  error.exitCode = 1;
  throw error;
};

const sameId = (left, right) => left?.toString() === right?.toString();

async function provisionDemoRector() {
  const email = String(env.DEMO_RECTOR_EMAIL || '').trim().toLowerCase();
  const password = String(env.DEMO_RECTOR_PASSWORD || '');
  const hostelName = String(env.DEMO_HOSTEL_NAME || '').trim();
  if (!email || !password || !hostelName) {
    fail('Set DEMO_RECTOR_EMAIL, DEMO_RECTOR_PASSWORD, and DEMO_HOSTEL_NAME before provisioning.');
  }
  if (password.length < 6) fail('DEMO_RECTOR_PASSWORD must be at least 6 characters.');

  const [rectorByMarker, rectorByEmail, hostel] = await Promise.all([
    User.findOne({ employeeId: DEMO_RECTOR_EMPLOYEE_ID }),
    User.findOne({ email }),
    Hostel.findOne({ name: hostelName })
  ]);

  if (rectorByEmail && !sameId(rectorByEmail._id, rectorByMarker?._id)) {
    fail('The configured demo email already belongs to another account. No changes were made.');
  }
  if (rectorByMarker && rectorByMarker.email?.toLowerCase() !== email) {
    fail('A different account already uses the reserved Demo Rector employee ID. No changes were made.');
  }
  if (rectorByMarker && rectorByMarker.role !== ROLES.RECTOR) {
    fail('The reserved Demo Rector employee ID belongs to a non-Rector account. No changes were made.');
  }
  if (rectorByMarker && (rectorByMarker.name !== DEMO_RECTOR_NAME || rectorByMarker.designation !== DEMO_RECTOR_DESIGNATION)) {
    fail('The reserved employee ID is attached to an account not identified as the Demo Rector. No changes were made.');
  }
  if (!hostel || !hostel.isActive || hostel.name !== hostelName) {
    fail('DEMO_HOSTEL_NAME must exactly match an existing active hostel. No changes were made.');
  }
  if (rectorByMarker?.hostelId && !sameId(rectorByMarker.hostelId, hostel._id)) {
    fail('The Demo Rector is already assigned to another hostel. No changes were made.');
  }
  if (hostel.rectorId && !sameId(hostel.rectorId, rectorByMarker?._id)) {
    fail('The configured demo hostel is assigned to another Rector. No changes were made.');
  }
  if (!rectorByMarker) {
    const [users, lostReports, foundReports] = await Promise.all([
      User.countDocuments({ hostelId: hostel._id }),
      LostReport.countDocuments({ hostelId: hostel._id }),
      FoundReport.countDocuments({ hostelId: hostel._id })
    ]);
    if (users || lostReports || foundReports) {
      fail('A new Demo Rector requires an active, unassigned hostel with no existing records. No changes were made.');
    }
  }

  let rector = rectorByMarker;
  if (rector) {
    rector.email = email;
    rector.password = password;
    rector.role = ROLES.RECTOR;
    rector.employeeId = DEMO_RECTOR_EMPLOYEE_ID;
    rector.isActive = true;
    rector.hostelId = hostel._id;
    await rector.save();
  } else {
    rector = await User.create({
      name: DEMO_RECTOR_NAME,
      email,
      password,
      role: ROLES.RECTOR,
      employeeId: DEMO_RECTOR_EMPLOYEE_ID,
      designation: DEMO_RECTOR_DESIGNATION,
      hostelId: hostel._id,
      isActive: true
    });
  }

  if (!sameId(hostel.rectorId, rector._id)) {
    hostel.rectorId = rector._id;
    await hostel.save();
  }

  // Verify the same persisted account via the app's normal password and demo checks.
  const persisted = await User.findOne({ email }).select('+password');
  if (!persisted || !(await persisted.comparePassword(password))) {
    fail('Provisioning completed but password verification failed.');
  }
  if (
    persisted.role !== ROLES.RECTOR || !persisted.isActive ||
    persisted.employeeId !== DEMO_RECTOR_EMPLOYEE_ID ||
    !sameId(persisted.hostelId, hostel._id)
  ) {
    fail('Provisioning completed but account verification failed.');
  }
  const credentials = await authService.getDemoRectorCredentials();
  const login = await authService.loginDemoRector();
  if (credentials.email !== email || login.user.email !== email || login.user.role !== ROLES.RECTOR) {
    fail('Provisioning completed but application demo authentication verification failed.');
  }

  return { hostelName: hostel.name, created: !rectorByMarker };
}

async function main() {
  if (
    !env.MONGODB_URI ||
    !/^mongodb(?:\+srv)?:\/\//i.test(env.MONGODB_URI) ||
    env.MONGODB_URI === 'mongodb://127.0.0.1:27017/fikrnot' ||
    /@?(?:localhost|127\.0\.0\.1)(?=[:/])/i.test(env.MONGODB_URI)
  ) {
    fail('Set MONGODB_URI to the intended remote MongoDB Atlas database before provisioning.');
  }
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const result = await provisionDemoRector();
  console.log(`Demo Rector ${result.created ? 'created' : 'updated'} and verified for active hostel: ${result.hostelName}.`);
  console.log('No password or database connection details were printed.');
}

if (require.main === module) {
  main()
    .catch((error) => {
      if (error.exitCode) console.error(error.message);
      else console.error('Demo Rector provisioning failed. Check the target database and service access; connection details were omitted.');
      process.exitCode = error.exitCode || 1;
    })
    .finally(async () => {
      if (mongoose.connection.readyState) await mongoose.disconnect();
    });
}

module.exports = { provisionDemoRector };
