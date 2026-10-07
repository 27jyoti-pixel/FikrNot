const LostReport = require('../../models/LostReport');
const Match = require('../../models/Match');
const Claim = require('../../models/Claim');

const {
  LOST_STATUS,
  MATCH_STATUS,
  CLAIM_STATUS,
  ROLES
} = require('../../constants');

const { runMatchingForReport } = require('../matching/matchingEngine');
const normalizeLocation = require('../../utils/normalizeLocation');
const deleteStoredImages = require('../../utils/deleteStoredImages');
const parseImageRemovalIds = require('../../utils/parseImageRemovalIds');

/*
|--------------------------------------------------------------------------
| Create Lost Report
|--------------------------------------------------------------------------
*/

const createLostReport = async (user, data, uploadedImages = []) => {
  if (user.role !== ROLES.STUDENT) {
    const error = new Error('Access denied. Only Students can create lost reports.');
    error.statusCode = 403;
    throw error;
  }

  const reportData = {
    reportedBy: user._id,
    hostelId: user.hostelId,
    category: data.category,
    itemName: data.itemName,
    brand: data.brand || '',
    color: data.color || '',
    description: data.description || '',
    images: uploadedImages,
    location: normalizeLocation(data.location),
    lostAt: data.lostAt ? new Date(data.lostAt) : new Date(),
    status: LOST_STATUS.ACTIVE
  };

  const report = await LostReport.create(reportData);

  try {
    await runMatchingForReport('LOST', report._id);
  } catch (err) {
    console.error('[Matching Engine Error on Lost Creation]', err);
  }

  return await LostReport.findById(report._id)
    .populate('reportedBy', 'name email studentId')
    .populate('hostelId', 'name location');
};

/*
|--------------------------------------------------------------------------
| Get Lost Reports
|--------------------------------------------------------------------------
*/

const getLostReports = async (user, query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const parsedLimit = parseInt(query.limit, 10);

  if (query.limit !== undefined && (isNaN(parsedLimit) || parsedLimit < 1)) {
    const error = new Error('Limit must be greater than 0');
    error.statusCode = 400;
    throw error;
  }

const limit = Math.min(parsedLimit || 10, 100);
  const skip = (page - 1) * limit;

  // Cancelled reports are hidden from normal listings.
  const filter = {
    'cancellation.isCancelled': { $ne: true }
  };

  /*
  |--------------------------------------------------------------------------
  | Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (user.role === ROLES.RECTOR) {
    // Rector can only manage/view reports from assigned hostel.
    filter.hostelId = user.hostelId;
  } else if (query.hostelId) {
    // Students can browse across hostels and optionally filter by hostel.
    filter.hostelId = query.hostelId;
  }

  /*
  |--------------------------------------------------------------------------
  | Filters
  |--------------------------------------------------------------------------
  */

  if (query.category) {
    filter.category = query.category;
  }

  if (query.status) {
    filter.status = query.status;
  }

  if (query.itemName) {
  filter.itemName = {
    $regex: query.itemName,
    $options: 'i'
  };
}

  if (query.startDate || query.endDate) {
    filter.lostAt = {};

    if (query.startDate) {
      filter.lostAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      filter.lostAt.$lte = new Date(query.endDate);
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Query
  |--------------------------------------------------------------------------
  */

  const total = await LostReport.countDocuments(filter);

  const reports = await LostReport.find(filter)
    // Do NOT expose private contact/room information.
    .populate('reportedBy', 'name email studentId')
    .populate('hostelId', 'name location')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1
    }
  };
};

/*
|--------------------------------------------------------------------------
| Get Lost Report By ID
|--------------------------------------------------------------------------
*/

const getLostReportById = async (id, user) => {
  const report = await LostReport.findById(id)
    // Do NOT expose phone number or room number.
    .populate('reportedBy', 'name email studentId')
    .populate('hostelId', 'name location');

  if (!report || report.cancellation?.isCancelled) {
    const error = new Error('Lost report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Rector Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (
    user.role === ROLES.RECTOR &&
    user.hostelId.toString() !== report.hostelId._id.toString()
  ) {
    const error = new Error(
      'Access denied. Rector can view only assigned hostel data.'
    );

    error.statusCode = 403;
    throw error;
  }

  return report;
};

/*
|--------------------------------------------------------------------------
| Update Lost Report
|--------------------------------------------------------------------------
*/

const updateLostReport = async (
  id,
  user,
  data,
  uploadedImages = []
) => {
  const report = await LostReport.findById(id);

  if (!report || report.cancellation?.isCancelled) {
    const error = new Error('Lost report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Ownership
  |--------------------------------------------------------------------------
  */

  if (report.reportedBy.toString() !== user._id.toString()) {
    const error = new Error(
      'Access denied. You can edit only your own lost report.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Lifecycle Restrictions
  |--------------------------------------------------------------------------
  |
  | ACTIVE and MATCH_FOUND reports can still be edited.
  | Once claim/recovery processing has started, editing is blocked.
  |
  */

  if (
    [
      LOST_STATUS.CLAIM_IN_PROGRESS,
      LOST_STATUS.RECOVERED,
      LOST_STATUS.CLOSED
    ].includes(report.status)
  ) {
    const error = new Error(
      `Cannot edit a lost report that is in status '${report.status}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Update Fields
  |--------------------------------------------------------------------------
  */

  if (data.category !== undefined) {
    report.category = data.category;
  }

  if (data.itemName !== undefined) {
    report.itemName = data.itemName;
  }

  if (data.brand !== undefined) {
    report.brand = data.brand;
  }

  if (data.color !== undefined) {
    report.color = data.color;
  }

  if (data.description !== undefined) {
    report.description = data.description;
  }

  if (data.location !== undefined) {
    report.location = normalizeLocation(data.location);
  }

  if (data.lostAt !== undefined) {
    report.lostAt = new Date(data.lostAt);
  }

  const removalIds = parseImageRemovalIds(data.removeImageIds);
  let imagesToDelete = [];
  if (uploadedImages.length > 0) {
    imagesToDelete = [...report.images];
    report.images = uploadedImages;
  } else if (removalIds.length > 0) {
    const removals = new Set(removalIds);
    imagesToDelete = report.images.filter((image) =>
      removals.has(image.publicId) || removals.has(image.url)
    );
    report.images = report.images.filter((image) =>
      !removals.has(image.publicId) && !removals.has(image.url)
    );
  }

  try {
    await report.save();
  } catch (error) {
    if (uploadedImages.length > 0) await deleteStoredImages(uploadedImages);
    throw error;
  }
  if (imagesToDelete.length > 0) await deleteStoredImages(imagesToDelete);

  /*
  |--------------------------------------------------------------------------
  | Re-run Matching
  |--------------------------------------------------------------------------
  */

  try {
    await runMatchingForReport('LOST', report._id);
  } catch (err) {
    console.error('[Matching Engine Error on Lost Update]', err);
  }

  return report;
};

/*
|--------------------------------------------------------------------------
| Cancel Lost Report
|--------------------------------------------------------------------------
|
| Cancellation is NOT a lifecycle status.
|
| ACTIVE
| MATCH_FOUND
|
| can be cancelled if there is no active claim.
|
*/

const cancelLostReport = async (id, user) => {
  if (user.role !== ROLES.STUDENT) {
    const error = new Error(
      'Access denied. Only Students can cancel lost reports.'
    );

    error.statusCode = 403;
    throw error;
  }

  const report = await LostReport.findById(id);

  if (!report) {
    const error = new Error('Lost report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Ownership
  |--------------------------------------------------------------------------
  */

  if (report.reportedBy.toString() !== user._id.toString()) {
    const error = new Error(
      'Access denied. You can cancel only your own lost report.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Already Cancelled
  |--------------------------------------------------------------------------
  */

  if (report.cancellation?.isCancelled) {
    const error = new Error('Lost report is already cancelled.');
    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Lifecycle Restriction
  |--------------------------------------------------------------------------
  |
  | A report cannot be cancelled once claim/recovery processing has begun.
  |
  */

  if (
    [
      LOST_STATUS.CLAIM_IN_PROGRESS,
      LOST_STATUS.RECOVERED,
      LOST_STATUS.CLOSED
    ].includes(report.status)
  ) {
    const error = new Error(
      `Cannot cancel a lost report that is in status '${report.status}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Active Claim Check
  |--------------------------------------------------------------------------
  */

  const activeClaim = await Claim.findOne({
    lostReportId: id,
    status: {
      $in: [
        CLAIM_STATUS.SUBMITTED,
        CLAIM_STATUS.UNDER_VERIFICATION,
        CLAIM_STATUS.APPROVED
      ]
    }
  });

  if (activeClaim) {
    const error = new Error(
      'Cannot cancel a lost report that has an active or approved ownership claim.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Record Cancellation
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Do NOT change report.status.
  |
  */

  report.cancellation = {
    isCancelled: true,
    cancelledBy: user._id,
    cancelledAt: new Date()
  };

  await report.save();

  /*
  |--------------------------------------------------------------------------
  | Invalidate Active Matches
  |--------------------------------------------------------------------------
  */

  await Match.updateMany(
    {
      lostReportId: id,
      status: MATCH_STATUS.ACTIVE
    },
    {
      $set: {
        status: MATCH_STATUS.INVALIDATED
      }
    }
  );

  return report;
};

/*
|--------------------------------------------------------------------------
| Delete Lost Report
|--------------------------------------------------------------------------
*/

const deleteLostReport = async (id, user) => {
  if (user.role !== ROLES.STUDENT) {
    const error = new Error(
      'Access denied. Only Students can delete lost reports.'
    );

    error.statusCode = 403;
    throw error;
  }

  const report = await LostReport.findById(id);

  if (!report) {
    const error = new Error('Lost report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Ownership
  |--------------------------------------------------------------------------
  */

  if (report.reportedBy.toString() !== user._id.toString()) {
    const error = new Error(
      'Access denied. You can delete only your own lost report.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Already Progressed Lifecycle
  |--------------------------------------------------------------------------
  */

  if (
    [
      LOST_STATUS.CLAIM_IN_PROGRESS,
      LOST_STATUS.RECOVERED,
      LOST_STATUS.CLOSED
    ].includes(report.status)
  ) {
    const error = new Error(
      `Cannot delete a lost report that is in status '${report.status}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Active Claim Check
  |--------------------------------------------------------------------------
  */

  const activeClaim = await Claim.findOne({
    lostReportId: id,
    status: {
      $in: [
        CLAIM_STATUS.SUBMITTED,
        CLAIM_STATUS.UNDER_VERIFICATION,
        CLAIM_STATUS.APPROVED
      ]
    }
  });

  if (activeClaim) {
    const error = new Error(
      'Cannot delete a lost report that has active or approved claims.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Invalidate Active Matches
  |--------------------------------------------------------------------------
  */

  await Match.updateMany(
    {
      lostReportId: id,
      status: MATCH_STATUS.ACTIVE
    },
    {
      $set: {
        status: MATCH_STATUS.INVALIDATED
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Delete
  |--------------------------------------------------------------------------
  */

  await report.deleteOne();

  return {
    message: 'Lost report deleted successfully'
  };
};

module.exports = {
  createLostReport,
  getLostReports,
  getLostReportById,
  updateLostReport,
  cancelLostReport,
  deleteLostReport
};
