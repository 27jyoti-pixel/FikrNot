const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse } = require('../utils/apiResponse');
const authService = require('../services/auth/authService');

const register = asyncWrapper(async (req, res) => {
  const result = await authService.registerStudent(req.body);
  return successResponse(res, 201, 'Student registered successfully', result);
});

const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser(email, password);
  return successResponse(res, 200, 'Login successful', result);
});

const getMe = asyncWrapper(async (req, res) => {
  return successResponse(res, 200, 'User profile fetched successfully', { user: req.user });
});

const logout = asyncWrapper(async (req, res) => {
  return successResponse(res, 200, 'Logged out successfully');
});

module.exports = {
  register,
  login,
  getMe,
  logout
};
