const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    profileImage: {
      type: String,
      default: ''
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: [true, 'Role is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    // Student specific fields
    studentId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    course: { type: String, trim: true },
    department: { type: String, trim: true },
    year: { type: Number },
    semester: { type: Number },
    address: { type: String },
    parentGuardian: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      email: { type: String, trim: true }
    },
    emergencyContact: { type: String, trim: true },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel'
    },
    roomNumber: { type: String, trim: true },
    // Rector specific fields
    employeeId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    designation: { type: String, trim: true }
  },
  {
    timestamps: true
  }
);

// Hash password before save if modified
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Indexes
userSchema.index({ hostelId: 1 });

const User = mongoose.model('User', userSchema);
module.exports = User;
