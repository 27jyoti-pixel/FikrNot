const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Hostel = require('../../models/Hostel');
const env = require('../../config/env');
const { ROLES } = require('../../constants');

const DEMO_RECTOR_EMPLOYEE_ID = 'DEMO-RECTOR';
const demoAccessError = (message, diagnosticCode, statusCode = 503) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.diagnosticCode = diagnosticCode;
  return error;
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

const registerStudent = async (userData) => {
  const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
  if (existingUser) {
    const error = new Error('Email is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const existingStudentId = await User.findOne({ studentId: userData.studentId });
  if (existingStudentId) {
    const error = new Error('Student ID is already registered.');
    error.statusCode = 409;
    throw error;
  }

  const hostel = await Hostel.findById(userData.hostelId);
  if (!hostel || !hostel.isActive) {
    const error = new Error('Invalid or inactive Hostel ID specified.');
    error.statusCode = 400;
    throw error;
  }

  const student = await User.create({
    name: userData.name,
    email: userData.email.toLowerCase(),
    password: userData.password,
    phone: userData.phone || '',
    role: ROLES.STUDENT,
    studentId: userData.studentId,
    course: userData.course || '',
    department: userData.department || '',
    year: userData.year || 1,
    semester: userData.semester || 1,
    address: userData.address || '',
    parentGuardian: userData.parentGuardian || {},
    emergencyContact: userData.emergencyContact || '',
    hostelId: userData.hostelId,
    roomNumber: userData.roomNumber || ''
  });

  const token = generateToken(student._id);
  return { user: student, token };
};

const loginUser = async (email, password) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.diagnosticCode = 'AUTH_USER_NOT_FOUND';
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact your hostel Rector.');
    error.statusCode = 403;
    error.diagnosticCode = 'AUTH_USER_INACTIVE';
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    error.diagnosticCode = 'AUTH_PASSWORD_MISMATCH';
    throw error;
  }

  const token = generateToken(user._id);
  const userObj = user.toJSON();
  return { user: userObj, token };
};

const loginDemoRector = async () => {
  if (!env.DEMO_RECTOR_EMAIL || !env.DEMO_RECTOR_PASSWORD) {
    throw demoAccessError(
      'Demo access is not configured on this server yet. Use your Rector credentials or ask an administrator to enable demo access.',
      'DEMO_RECTOR_CONFIG_MISSING'
    );
  }

  let result;
  try {
    result = await loginUser(env.DEMO_RECTOR_EMAIL, env.DEMO_RECTOR_PASSWORD);
  } catch (error) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      const unavailable = new Error(
        'Demo access is unavailable right now. Use your Rector credentials or ask an administrator to check the demo account.'
      );
      unavailable.statusCode = 503;
      unavailable.diagnosticCode = 'DEMO_RECTOR_LOGIN_REJECTED';
      throw unavailable;
    }
    error.diagnosticCode ||= 'DEMO_RECTOR_LOGIN_FAILED';
    throw error;
  }

  const demoUser = await User.findById(result.user._id);
  const demoHostel = demoUser?.hostelId
    ? await Hostel.findById(demoUser.hostelId)
    : null;
  if (
    result.user.role !== ROLES.RECTOR ||
    demoUser?.employeeId !== DEMO_RECTOR_EMPLOYEE_ID ||
    !demoHostel ||
    demoHostel.name !== env.DEMO_HOSTEL_NAME
  ) {
    throw demoAccessError(
      'Demo access is unavailable right now. Use your Rector credentials or ask an administrator to check the demo account.',
      'DEMO_RECTOR_ACCOUNT_MISMATCH'
    );
  }

  return result;
};

const getDemoRectorCredentials = async () => {
  if (!env.DEMO_RECTOR_EMAIL || !env.DEMO_RECTOR_PASSWORD) {
    throw demoAccessError(
      'Demo Rector credentials have not been configured on this server.',
      'DEMO_RECTOR_CONFIG_MISSING'
    );
  }

  let demoUser;
  let demoHostel;
  let passwordMatches;
  try {
    demoUser = await User.findOne({ email: env.DEMO_RECTOR_EMAIL.toLowerCase() })
      .select('+password');
    demoHostel = demoUser?.hostelId
      ? await Hostel.findById(demoUser.hostelId)
      : null;
    passwordMatches = demoUser
      ? await demoUser.comparePassword(env.DEMO_RECTOR_PASSWORD)
      : false;
  } catch (cause) {
    const error = demoAccessError(
      'Demo Rector credentials could not be verified right now.',
      'DEMO_RECTOR_CREDENTIAL_LOOKUP_FAILED',
      500
    );
    error.cause = cause;
    throw error;
  }

  if (!demoUser) throw demoAccessError(
    'Demo Rector credentials are unavailable until the designated account is provisioned.',
    'DEMO_RECTOR_ACCOUNT_NOT_PROVISIONED'
  );
  if (!demoUser.isActive || demoUser.role !== ROLES.RECTOR || demoUser.employeeId !== DEMO_RECTOR_EMPLOYEE_ID) {
    throw demoAccessError(
      'Demo Rector credentials are unavailable until the designated account is provisioned.',
      'DEMO_RECTOR_ACCOUNT_MISMATCH'
    );
  }
  if (!passwordMatches) throw demoAccessError(
    'Demo Rector credentials are unavailable until the designated account is provisioned.',
    'DEMO_RECTOR_PASSWORD_HASH_MISMATCH'
  );
  if (!demoHostel || demoHostel.name !== env.DEMO_HOSTEL_NAME) throw demoAccessError(
    'Demo Rector credentials are unavailable until the designated account is provisioned.',
    'DEMO_RECTOR_HOSTEL_MISMATCH'
  );

  // This public endpoint returns only the intentionally shared demo account, after
  // verifying its reserved marker, assigned hostel, active state, and stored hash.
  return {
    email: demoUser.email,
    password: env.DEMO_RECTOR_PASSWORD
  };
};

module.exports = {
  generateToken,
  registerStudent,
  loginUser,
  loginDemoRector,
  getDemoRectorCredentials,
  DEMO_RECTOR_EMPLOYEE_ID
};
