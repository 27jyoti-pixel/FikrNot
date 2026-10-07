const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Hostel = require('../../models/Hostel');
const env = require('../../config/env');
const { ROLES } = require('../../constants');

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
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Your account has been deactivated. Please contact your hostel Rector.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user._id);
  const userObj = user.toJSON();
  return { user: userObj, token };
};

module.exports = {
  generateToken,
  registerStudent,
  loginUser
};
