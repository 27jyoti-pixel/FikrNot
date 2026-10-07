const FoundReport = require('../../models/FoundReport');
const Match = require('../../models/Match');
const Claim = require('../../models/Claim');
const Notification = require('../../models/Notification');

const {
  FOUND_STATUS,
  ROLES,
  MATCH_STATUS,
  CLAIM_STATUS,
  NOTIFICATION_TYPES
} = require('../../constants');

const { isValidFoundTransition } = require('../../utils/statusTransitions');
const { runMatchingForReport } = require('../matching/matchingEngine');
const normalizeLocation = require('../../utils/normalizeLocation');
const deleteStoredImages = require('../../utils/deleteStoredImages');
const parseImageRemovalIds = require('../../utils/parseImageRemovalIds');

/*
|--------------------------------------------------------------------------
| Create Found Report
|--------------------------------------------------------------------------
*/

const createFoundReport = async (user, data, uploadedImages = []) => {
  if (user.role !== ROLES.STUDENT) {
    const error = new Error(
      'Access denied. Only Students can create found reports.'
    );

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
    foundAt: data.foundAt ? new Date(data.foundAt) : new Date(),
    status: FOUND_STATUS.REPORTED
  };

  const report = await FoundReport.create(reportData);

  try {
    await runMatchingForReport('FOUND', report._id);
  } catch (err) {
    console.error('[Matching Engine Error on Found Creation]', err);
  }

  return await FoundReport.findById(report._id)
    .populate('reportedBy', 'name email studentId')
    .populate('hostelId', 'name location');
};

/*
|--------------------------------------------------------------------------
| Get Found Reports
|--------------------------------------------------------------------------
*/

const getFoundReports = async (user, query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || 10, 1),
    100
  );
  const skip = (page - 1) * limit;

  // Cancelled reports are excluded from normal listings.
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
    // Students can browse across hostels.
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

  if (query.search) {
    filter.itemName = {
      $regex: query.search,
      $options: 'i'
    };
  }

  if (query.startDate || query.endDate) {
    filter.foundAt = {};

    if (query.startDate) {
      filter.foundAt.$gte = new Date(query.startDate);
    }

    if (query.endDate) {
      filter.foundAt.$lte = new Date(query.endDate);
    }
  }

  const total = await FoundReport.countDocuments(filter);

  const reports = await FoundReport.find(filter)
    // Do not expose finder phone number or room number.
    .populate('reportedBy', 'name email studentId')
    .populate('rectorId', 'name email designation')
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
| Get Found Report By ID
|--------------------------------------------------------------------------
*/

const getFoundReportById = async (id, user) => {
  const report = await FoundReport.findById(id)
    .populate('reportedBy', 'name email studentId')
    .populate('rectorId', 'name email designation')
    .populate('hostelId', 'name location');

  if (!report || report.cancellation?.isCancelled) {
    const error = new Error('Found report not found');
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
| Update Found Report
|--------------------------------------------------------------------------
*/

const updateFoundReport = async (
  id,
  user,
  data,
  uploadedImages = []
) => {
  const report = await FoundReport.findById(id);

  if (!report || report.cancellation?.isCancelled) {
    const error = new Error('Found report not found');
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
      'Access denied. You can edit only your own found report.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Lifecycle Restrictions
  |--------------------------------------------------------------------------
  |
  | A student may edit before physical custody / claim processing.
  |
  */

  if (
    [
      FOUND_STATUS.WITH_RECTOR,
      FOUND_STATUS.CLAIM_IN_PROGRESS,
      FOUND_STATUS.RETURNED,
      FOUND_STATUS.CLOSED
    ].includes(report.status)
  ) {
    const error = new Error(
      `Cannot edit a found report that is in status '${report.status}'.`
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

  if (data.foundAt !== undefined) {
    report.foundAt = new Date(data.foundAt);
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
    await runMatchingForReport('FOUND', report._id);
  } catch (err) {
    console.error('[Matching Engine Error on Found Update]', err);
  }

  return report;
};

/*
|--------------------------------------------------------------------------
| Receive Found Item By Rector
|--------------------------------------------------------------------------
|
| This is the physical custody operation:
|
| REPORTED
|     ↓
| AWAITING_HANDOVER
|     ↓
| WITH_RECTOR
|
*/

const receiveFoundItemByRector = async (id, rector) => {
  const report = await FoundReport.findById(id);

  if (!report || report.cancellation?.isCancelled) {
    const error = new Error('Found report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Rector Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (report.hostelId.toString() !== rector.hostelId.toString()) {
    const error = new Error(
      'Access denied. Rector can receive items only for assigned hostel.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Physical Custody Transition
  |--------------------------------------------------------------------------
  */

  if (
    !isValidFoundTransition(
      report.status,
      FOUND_STATUS.WITH_RECTOR
    )
  ) {
    const error = new Error(
      `Cannot transition item status from '${report.status}' to 'WITH_RECTOR'.`
    );

    error.statusCode = 400;
    throw error;
  }

  report.status = FOUND_STATUS.WITH_RECTOR;
  report.rectorId = rector._id;
  report.receivedAt = new Date();

  await report.save();

  /*
  |--------------------------------------------------------------------------
  | Notify Finder
  |--------------------------------------------------------------------------
  */

  await Notification.create({
    userId: report.reportedBy,
    type: NOTIFICATION_TYPES.ITEM_RECEIVED,
    title: 'Physical Item Received by Rector',
    message: `Rector ${rector.name} confirmed physical custody of found item "${report.itemName}".`,
    relatedId: report._id
  });

  return report;
};

/*
|--------------------------------------------------------------------------
| Update Found Status By Rector
|--------------------------------------------------------------------------
|
| Rector can perform only valid lifecycle transitions.
|
*/

const updateFoundStatusByRector = async (
  id,
  rector,
  newStatus
) => {
  const report = await FoundReport.findById(id);

  if (!report || report.cancellation?.isCancelled) {
    const error = new Error('Found report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Rector Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (report.hostelId.toString() !== rector.hostelId.toString()) {
    const error = new Error(
      'Access denied. Rector can manage status only for assigned hostel.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Physical Custody Must Use /receive
  |--------------------------------------------------------------------------
  |
  | Do not allow generic status update to bypass the physical handover
  | operation.
  |
  */

  if (newStatus === FOUND_STATUS.WITH_RECTOR) {
    const error = new Error(
      'Use the receive endpoint to move a found item to WITH_RECTOR.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Recovery Must Use Recovery Endpoint
  |--------------------------------------------------------------------------
  |
  | RETURNED and CLOSED are recovery workflow states.
  | They must NOT be set through the generic status endpoint.
  |
  */

  if (
    newStatus === FOUND_STATUS.RETURNED ||
    newStatus === FOUND_STATUS.CLOSED
  ) {
    const error = new Error(
      'Use the recovery endpoint to complete the found item recovery.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Lifecycle Transition
  |--------------------------------------------------------------------------
  */

  if (!isValidFoundTransition(report.status, newStatus)) {
    const error = new Error(
      `Invalid status transition from '${report.status}' to '${newStatus}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Additional Custody Protection
  |--------------------------------------------------------------------------
  |
  | A found item cannot enter claim processing before physical custody.
  |
  */

  if (
    newStatus === FOUND_STATUS.CLAIM_IN_PROGRESS &&
    report.status !== FOUND_STATUS.WITH_RECTOR
  ) {
    const error = new Error(
      'Found item must be WITH_RECTOR before claim processing begins.'
    );

    error.statusCode = 400;
    throw error;
  }

  report.status = newStatus;

  await report.save();

  return report;
};

/*
|--------------------------------------------------------------------------
| Cancel Found Report
|--------------------------------------------------------------------------
|
| Cancellation does NOT create a new lifecycle status.
|
*/

const cancelFoundReport = async (id, user) => {
  if (user.role !== ROLES.STUDENT) {
    const error = new Error(
      'Access denied. Only Students can cancel found reports.'
    );

    error.statusCode = 403;
    throw error;
  }

  const report = await FoundReport.findById(id);

  if (!report) {
    const error = new Error('Found report not found');
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
      'Access denied. You can cancel only your own found report.'
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
    const error = new Error('Found report is already cancelled.');
    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Lifecycle Restriction
  |--------------------------------------------------------------------------
  |
  | Once physical custody or claim/recovery processing begins,
  | cancellation is not allowed.
  |
  */

  if (
    [
      FOUND_STATUS.WITH_RECTOR,
      FOUND_STATUS.CLAIM_IN_PROGRESS,
      FOUND_STATUS.RETURNED,
      FOUND_STATUS.CLOSED
    ].includes(report.status)
  ) {
    const error = new Error(
      `Cannot cancel a found report that is in status '${report.status}'.`
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
    foundReportId: id,
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
      'Cannot cancel a found report that has an active or approved ownership claim.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Record Cancellation
  |--------------------------------------------------------------------------
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
      foundReportId: id,
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
| Delete Found Report
|--------------------------------------------------------------------------
*/

const deleteFoundReport = async (id, user) => {
  if (user.role !== ROLES.STUDENT) {
    const error = new Error(
      'Access denied. Only Students can delete found reports.'
    );

    error.statusCode = 403;
    throw error;
  }

  const report = await FoundReport.findById(id);

  if (!report) {
    const error = new Error('Found report not found');
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
      'Access denied. You can delete only your own found report.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Lifecycle Restriction
  |--------------------------------------------------------------------------
  */

  if (
    [
      FOUND_STATUS.WITH_RECTOR,
      FOUND_STATUS.CLAIM_IN_PROGRESS,
      FOUND_STATUS.RETURNED,
      FOUND_STATUS.CLOSED
    ].includes(report.status)
  ) {
    const error = new Error(
      `Cannot delete a found report that is in status '${report.status}'.`
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
    foundReportId: id,
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
      'Cannot delete a found report that has active or approved claims.'
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
      foundReportId: id,
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
    message: 'Found report deleted successfully'
  };
};

module.exports = {
  createFoundReport,
  getFoundReports,
  getFoundReportById,
  updateFoundReport,
  receiveFoundItemByRector,
  updateFoundStatusByRector,
  cancelFoundReport,
  deleteFoundReport
};
