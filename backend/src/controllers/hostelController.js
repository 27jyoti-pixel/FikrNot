const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse } = require('../utils/apiResponse');
const Hostel = require('../models/Hostel');

const getHostels = asyncWrapper(async (req, res) => {
  const hostels = await Hostel.find({ isActive: true })
    .select('_id name')
    .sort({ name: 1 })
    .lean();

  return successResponse(
    res,
    200,
    'Hostels retrieved successfully',
    hostels
  );
});

const getHostelById = asyncWrapper(async (req, res) => {
  const hostel = await Hostel.findById(req.params.id).populate(
    'rectorId',
    'name email designation'
  );

  if (!hostel) {
    return res.status(404).json({
      success: false,
      message: 'Hostel not found'
    });
  }

  return successResponse(
    res,
    200,
    'Hostel details retrieved',
    hostel
  );
});

const getMyHostel = asyncWrapper(async (req, res) => {
  if (!req.user.hostelId) {
    return res.status(404).json({
      success: false,
      message: 'User is not assigned to any hostel'
    });
  }

  const hostel = await Hostel.findById(req.user.hostelId).populate(
    'rectorId',
    'name email designation'
  );

  if (!hostel) {
    return res.status(404).json({
      success: false,
      message: 'Assigned hostel not found'
    });
  }

  return successResponse(
    res,
    200,
    'Assigned hostel details retrieved',
    hostel
  );
});

module.exports = {
  getHostels,
  getHostelById,
  getMyHostel
};
