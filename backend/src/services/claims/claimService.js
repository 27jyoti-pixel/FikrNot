const Claim = require('../../models/Claim');
const FoundReport = require('../../models/FoundReport');
const LostReport = require('../../models/LostReport');
const Hostel = require('../../models/Hostel');
const Notification = require('../../models/Notification');

const {
  CLAIM_STATUS,
  FOUND_STATUS,
  LOST_STATUS,
  NOTIFICATION_TYPES
} = require('../../constants');

const { isValidClaimTransition } = require('../../utils/statusTransitions');

/*
|--------------------------------------------------------------------------
| Submit Claim
|--------------------------------------------------------------------------
*/

const submitClaim = async (student, data) => {
  const foundReport = await FoundReport.findById(data.foundReportId);

  if (!foundReport) {
    const error = new Error('Found report not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Claimable State
  |--------------------------------------------------------------------------
  |
  | A student can claim an item only after the physical item is with
  | the responsible Rector.
  |
  */

  if (foundReport.status !== FOUND_STATUS.WITH_RECTOR) {
    const error = new Error(
      `Cannot submit a claim for a found item in status '${foundReport.status}'. Item must be WITH_RECTOR first.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Cancelled Report Protection
  |--------------------------------------------------------------------------
  */

  if (foundReport.cancellation?.isCancelled) {
    const error = new Error('Cannot submit a claim for a cancelled found report.');
    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Active Claims
  |--------------------------------------------------------------------------
  */

  const existingClaim = await Claim.findOne({
    foundReportId: data.foundReportId,
    claimantId: student._id,
    status: {
      $in: [
        CLAIM_STATUS.SUBMITTED,
        CLAIM_STATUS.UNDER_VERIFICATION,
        CLAIM_STATUS.APPROVED
      ]
    }
  });

  if (existingClaim) {
    const error = new Error(
      'You already have an active or approved claim for this found item.'
    );

    error.statusCode = 409;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Optional Lost Report
  |--------------------------------------------------------------------------
  |
  | If a lostReportId is supplied, it must belong to the student.
  | Otherwise reject the request instead of silently attaching an
  | unrelated report.
  |
  */

  let lostReportId = null;

  if (data.lostReportId) {
    const lostReport = await LostReport.findById(data.lostReportId);

    if (!lostReport) {
      const error = new Error('Lost report not found.');
      error.statusCode = 404;
      throw error;
    }

    if (
      lostReport.reportedBy.toString() !== student._id.toString()
    ) {
      const error = new Error(
        'Access denied. You can link only your own lost report.'
      );

      error.statusCode = 403;
      throw error;
    }

    if (lostReport.cancellation?.isCancelled) {
      const error = new Error(
        'Cannot link a cancelled lost report to a claim.'
      );

      error.statusCode = 400;
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Lost Report Must Be In MATCH_FOUND
    |--------------------------------------------------------------------------
    */

    if (lostReport.status !== LOST_STATUS.MATCH_FOUND) {
      const error = new Error(
        `Lost report must be in '${LOST_STATUS.MATCH_FOUND}' before it can be linked to a claim.`
      );

      error.statusCode = 400;
      throw error;
    }

    lostReportId = lostReport._id;
  }

  /*
  |--------------------------------------------------------------------------
  | Create Claim
  |--------------------------------------------------------------------------
  */

  const claim = await Claim.create({
    foundReportId: data.foundReportId,
    lostReportId,
    claimantId: student._id,
    evidence: data.evidence,
    status: CLAIM_STATUS.SUBMITTED
  });

  /*
  |--------------------------------------------------------------------------
  | Notify Responsible Rector
  |--------------------------------------------------------------------------
  */

  const hostel = await Hostel.findById(foundReport.hostelId);

  if (hostel && hostel.rectorId) {
    await Notification.create({
      userId: hostel.rectorId,
      type: NOTIFICATION_TYPES.CLAIM_SUBMITTED,
      title: 'New Ownership Claim Submitted',
      message: `Student ${student.name} submitted a claim for found item "${foundReport.itemName}".`,
      relatedId: claim._id
    });
  }

  /*
  |--------------------------------------------------------------------------
  | Response
  |--------------------------------------------------------------------------
  |
  | Do not expose claimant phone number or room number.
  |
  */

  return await Claim.findById(claim._id)
    .populate('foundReportId')
    .populate('lostReportId')
    .populate('claimantId', 'name email studentId');
};

/*
|--------------------------------------------------------------------------
| Get Student Claims
|--------------------------------------------------------------------------
*/

const getStudentClaims = async (student) => {
  return await Claim.find({
    claimantId: student._id
  })
    .populate('foundReportId')
    .populate('lostReportId')
    .sort({ createdAt: -1 });
};

const getRectorClaims = async (rector, query = {}) => {
  if (rector.role !== 'rector' || !rector.hostelId) {
    const error = new Error('Rector must have an assigned hostel to review claims.');
    error.statusCode = 403;
    throw error;
  }

  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const parsedLimit = Number.parseInt(query.limit, 10);
  const limit = Math.min(Math.max(parsedLimit || 20, 1), 100);
  const skip = (page - 1) * limit;
  const foundReports = await FoundReport.find({ hostelId: rector.hostelId }).select('_id');
  const filter = { foundReportId: { $in: foundReports.map((report) => report._id) } };
  if (Object.values(CLAIM_STATUS).includes(query.status)) filter.status = query.status;

  const [total, claims] = await Promise.all([
    Claim.countDocuments(filter),
    Claim.find(filter)
      .populate({
        path: 'foundReportId',
        select: 'itemName category location foundAt status hostelId'
      })
      .populate('lostReportId', 'itemName category status')
      .populate('claimantId', 'name email studentId course department year')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
  ]);

  return {
    claims,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };
};

/*
|--------------------------------------------------------------------------
| Get Claim By ID
|--------------------------------------------------------------------------
*/

const getClaimById = async (claimId, user) => {
  const claim = await Claim.findById(claimId)
    .populate({
      path: 'foundReportId',
      populate: {
        path: 'hostelId',
        select: 'name'
      }
    })
    .populate('lostReportId')
    .populate(
      'claimantId',
      'name email studentId course department year'
    )
    .populate('reviewedBy', 'name designation');

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Student Ownership
  |--------------------------------------------------------------------------
  */

  if (
    user.role === 'student' &&
    claim.claimantId._id.toString() !== user._id.toString()
  ) {
    const error = new Error(
      'Access denied. You can view only your own claims.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Rector Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (
    user.role === 'rector' &&
    claim.foundReportId?.hostelId?._id?.toString() !==
      user.hostelId?.toString()
  ) {
    const error = new Error(
      'Access denied. Rector can view only assigned hostel claims.'
    );

    error.statusCode = 403;
    throw error;
  }

  return claim;
};

/*
|--------------------------------------------------------------------------
| Update Claim Evidence
|--------------------------------------------------------------------------
*/

const updateClaimEvidence = async (
  claimId,
  student,
  evidence
) => {
  const claim = await Claim.findById(claimId);

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Ownership
  |--------------------------------------------------------------------------
  */

  if (
    claim.claimantId.toString() !== student._id.toString()
  ) {
    const error = new Error(
      'Access denied. You can edit evidence for only your own claim.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Evidence Can Be Updated Only While Pending Verification
  |--------------------------------------------------------------------------
  */

  if (
    ![
      CLAIM_STATUS.SUBMITTED,
      CLAIM_STATUS.UNDER_VERIFICATION
    ].includes(claim.status)
  ) {
    const error = new Error(
      `Cannot update evidence for a claim in status '${claim.status}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  claim.evidence = evidence;

  await claim.save();

  return claim;
};

/*
|--------------------------------------------------------------------------
| Withdraw Claim
|--------------------------------------------------------------------------
|
| Withdrawal does NOT create another claim status.
| The pending claim is removed.
|
*/

const withdrawClaim = async (claimId, student) => {
  const claim = await Claim.findById(claimId);

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Ownership
  |--------------------------------------------------------------------------
  */

  if (
    claim.claimantId.toString() !== student._id.toString()
  ) {
    const error = new Error(
      'Access denied. You can withdraw only your own claim.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Only Pending Claims Can Be Withdrawn
  |--------------------------------------------------------------------------
  */

  if (
    ![
      CLAIM_STATUS.SUBMITTED,
      CLAIM_STATUS.UNDER_VERIFICATION
    ].includes(claim.status)
  ) {
    const error = new Error(
      `Cannot withdraw a claim that is already '${claim.status}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  await claim.deleteOne();

  return {
    message: 'Claim withdrawn successfully'
  };
};

/*
|--------------------------------------------------------------------------
| Review Claim
|--------------------------------------------------------------------------
|
| SUBMITTED
|     ↓
| UNDER_VERIFICATION
|     ↓
| APPROVED / REJECTED
|
*/

const reviewClaim = async (
  claimId,
  rector,
  newStatus,
  rejectionReason = ''
) => {
  const claim = await Claim.findById(claimId)
    .populate('foundReportId');

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Rector Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (
    claim.foundReportId.hostelId.toString() !==
    rector.hostelId.toString()
  ) {
    const error = new Error(
      'Access denied. Rector can review claims only for assigned hostel.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Self-Claim Protection
  |--------------------------------------------------------------------------
  */

  if (
    claim.claimantId.toString() === rector._id.toString()
  ) {
    const error = new Error(
      'Rector cannot review or approve their own claim.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Claim Transition
  |--------------------------------------------------------------------------
  */

  if (!isValidClaimTransition(claim.status, newStatus)) {
    const error = new Error(
      `Invalid claim status transition from '${claim.status}' to '${newStatus}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | APPROVAL
  |--------------------------------------------------------------------------
  |
  | Approval is allowed only when:
  |
  | Found Report = WITH_RECTOR
  |
  | If a Lost Report is linked:
  | Lost Report = MATCH_FOUND
  |
  */

  if (newStatus === CLAIM_STATUS.APPROVED) {
    const foundReport = await FoundReport.findById(
      claim.foundReportId._id
    );

    if (!foundReport) {
      const error = new Error('Associated found report not found.');
      error.statusCode = 404;
      throw error;
    }

    if (foundReport.status !== FOUND_STATUS.WITH_RECTOR) {
      const error = new Error(
        `Claim cannot be approved because the found report is in status '${foundReport.status}'. It must be WITH_RECTOR.`
      );

      error.statusCode = 400;
      throw error;
    }

    if (foundReport.cancellation?.isCancelled) {
      const error = new Error(
        'Cannot approve a claim for a cancelled found report.'
      );

      error.statusCode = 400;
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Linked Lost Report Validation
    |--------------------------------------------------------------------------
    */

    let lostReport = null;

    if (claim.lostReportId) {
      lostReport = await LostReport.findById(
        claim.lostReportId
      );

      if (!lostReport) {
        const error = new Error(
          'Associated lost report not found.'
        );

        error.statusCode = 404;
        throw error;
      }

      if (lostReport.cancellation?.isCancelled) {
        const error = new Error(
          'Cannot approve a claim linked to a cancelled lost report.'
        );

        error.statusCode = 400;
        throw error;
      }

      if (lostReport.status !== LOST_STATUS.MATCH_FOUND) {
        const error = new Error(
          `Claim cannot be approved because the lost report is in status '${lostReport.status}'. It must be MATCH_FOUND.`
        );

        error.statusCode = 400;
        throw error;
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Move Reports Into Claim Processing
    |--------------------------------------------------------------------------
    */

    foundReport.status = FOUND_STATUS.CLAIM_IN_PROGRESS;
    await foundReport.save();

    if (lostReport) {
      lostReport.status = LOST_STATUS.CLAIM_IN_PROGRESS;
      await lostReport.save();
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Update Claim
  |--------------------------------------------------------------------------
  */

  claim.status = newStatus;
  claim.reviewedBy = rector._id;
  claim.reviewedAt = new Date();

  if (newStatus === CLAIM_STATUS.REJECTED) {
    claim.rejectionReason = rejectionReason;

    await Notification.create({
      userId: claim.claimantId,
      type: NOTIFICATION_TYPES.CLAIM_REJECTED,
      title: 'Ownership Claim Rejected',
      message: `Your claim for "${claim.foundReportId.itemName}" was rejected. Reason: ${rejectionReason}`,
      relatedId: claim._id
    });
  }

  if (newStatus === CLAIM_STATUS.APPROVED) {
    await Notification.create({
      userId: claim.claimantId,
      type: NOTIFICATION_TYPES.CLAIM_APPROVED,
      title: 'Ownership Claim Approved!',
      message: `Your claim for "${claim.foundReportId.itemName}" has been approved. Please collect the item from your Rector.`,
      relatedId: claim._id
    });
  }

  await claim.save();

  return claim;
};

/*
|--------------------------------------------------------------------------
| Request More Information
|--------------------------------------------------------------------------
|
| Status remains UNDER_VERIFICATION.
|
*/

const requestMoreInfo = async (
  claimId,
  rector,
  infoRequestedReason
) => {
  const claim = await Claim.findById(claimId)
    .populate('foundReportId');

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Rector Hostel Scope
  |--------------------------------------------------------------------------
  */

  if (
    claim.foundReportId.hostelId.toString() !==
    rector.hostelId.toString()
  ) {
    const error = new Error(
      'Access denied. Rector can request information only for assigned hostel claims.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Request Info Only While Pending
  |--------------------------------------------------------------------------
  */

  if (
    ![
      CLAIM_STATUS.SUBMITTED,
      CLAIM_STATUS.UNDER_VERIFICATION
    ].includes(claim.status)
  ) {
    const error = new Error(
      `Cannot request information for a claim in status '${claim.status}'.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Status Remains UNDER_VERIFICATION
  |--------------------------------------------------------------------------
  */

  claim.status = CLAIM_STATUS.UNDER_VERIFICATION;
  claim.infoRequestedReason = infoRequestedReason;

  await claim.save();

  await Notification.create({
    userId: claim.claimantId,
    type: NOTIFICATION_TYPES.MORE_INFO_REQUIRED,
    title: 'Additional Information Requested for Claim',
    message: `Rector requested additional evidence for your claim on "${claim.foundReportId.itemName}". Detail: ${infoRequestedReason}`,
    relatedId: claim._id
  });

  return claim;
};

module.exports = {
  submitClaim,
  getStudentClaims,
  getRectorClaims,
  getClaimById,
  updateClaimEvidence,
  withdrawClaim,
  reviewClaim,
  requestMoreInfo
};
