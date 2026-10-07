const Claim = require('../../models/Claim');
const FoundReport = require('../../models/FoundReport');
const LostReport = require('../../models/LostReport');
const Match = require('../../models/Match');
const Notification = require('../../models/Notification');

const {
  CLAIM_STATUS,
  FOUND_STATUS,
  LOST_STATUS,
  MATCH_STATUS,
  NOTIFICATION_TYPES
} = require('../../constants');

const {
  isValidFoundTransition,
  isValidLostTransition
} = require('../../utils/statusTransitions');

/*
|--------------------------------------------------------------------------
| Confirm Recovery By Student
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| The student confirmation does NOT change:
|
| FoundReport.status
| LostReport.status
| Match.status
|
| It only records that the claimant confirmed successful physical recovery.
|
*/

const confirmRecoveryByStudent = async (claimId, student) => {
  const claim = await Claim.findById(claimId)
    .populate('foundReportId');

  if (!claim) {
    const error = new Error('Claim not found');
    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Claimant Ownership
  |--------------------------------------------------------------------------
  */

  if (
    claim.claimantId.toString() !== student._id.toString()
  ) {
    const error = new Error(
      'Access denied. You can confirm recovery only for your own approved claim.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Claim Must Be Approved
  |--------------------------------------------------------------------------
  */

  if (claim.status !== CLAIM_STATUS.APPROVED) {
    const error = new Error(
      `Cannot confirm recovery for a claim in status '${claim.status}'. Claim must be APPROVED.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Confirmation
  |--------------------------------------------------------------------------
  */

  if (claim.studentConfirmedAt) {
    const error = new Error(
      'Recovery has already been confirmed by the student.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Found Report
  |--------------------------------------------------------------------------
  */

  const foundReport = await FoundReport.findById(
    claim.foundReportId._id
  );

  if (!foundReport) {
    const error = new Error(
      'Associated Found report not found.'
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Found Item Must Still Be In Claim Processing
  |--------------------------------------------------------------------------
  */

  if (foundReport.status !== FOUND_STATUS.CLAIM_IN_PROGRESS) {
    const error = new Error(
      `Cannot confirm recovery while the found report is in status '${foundReport.status}'. It must be CLAIM_IN_PROGRESS.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Optional Lost Report Validation
  |--------------------------------------------------------------------------
  */

  let lostReport = null;

  if (claim.lostReportId) {
    lostReport = await LostReport.findById(
      claim.lostReportId
    );

    if (!lostReport) {
      const error = new Error(
        'Associated Lost report not found.'
      );

      error.statusCode = 404;
      throw error;
    }

    if (lostReport.status !== LOST_STATUS.CLAIM_IN_PROGRESS) {
      const error = new Error(
        `Cannot confirm recovery while the lost report is in status '${lostReport.status}'. It must be CLAIM_IN_PROGRESS.`
      );

      error.statusCode = 400;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Record Student Confirmation Only
  |--------------------------------------------------------------------------
  */

  claim.studentConfirmedAt = new Date();
  claim.studentConfirmedBy = student._id;

  await claim.save();

  /*
  |--------------------------------------------------------------------------
  | Notify Rector
  |--------------------------------------------------------------------------
  */

  if (foundReport.rectorId) {
    await Notification.create({
      userId: foundReport.rectorId,
      type: NOTIFICATION_TYPES.RECOVERY_CONFIRMED,
      title: 'Student Confirmed Item Recovery',
      message: `Student ${student.name} confirmed successful physical recovery of item "${foundReport.itemName}". Please complete the recovery process.`,
      relatedId: claim._id
    });
  }

  return {
    success: true,
    message:
      'Recovery confirmation recorded successfully. The Rector must complete the recovery process.',
    claim
  };
};

/*
|--------------------------------------------------------------------------
| Complete Recovery By Rector
|--------------------------------------------------------------------------
|
| This is the operation that performs the final lifecycle transitions.
|
| Found:
| CLAIM_IN_PROGRESS → RETURNED
|
| Lost:
| CLAIM_IN_PROGRESS → RECOVERED
|
| Match:
| ACTIVE → RESOLVED
|
*/

const completeRecoveryByRector = async (claimId, rector) => {
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
      'Access denied. Rector can complete recovery only for assigned hostel items.'
    );

    error.statusCode = 403;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Claim Must Be Approved
  |--------------------------------------------------------------------------
  */

  if (claim.status !== CLAIM_STATUS.APPROVED) {
    const error = new Error(
      `Cannot complete recovery for a claim in status '${claim.status}'. Claim must be APPROVED.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Student Must Confirm First
  |--------------------------------------------------------------------------
  */

  if (!claim.studentConfirmedAt) {
    const error = new Error(
      'Student must confirm successful recovery before the Rector can complete the recovery process.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Prevent Duplicate Rector Completion
  |--------------------------------------------------------------------------
  */

  if (claim.rectorCompletedAt) {
    const error = new Error(
      'Recovery has already been completed by the Rector.'
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Found Report
  |--------------------------------------------------------------------------
  */

  const foundReport = await FoundReport.findById(
    claim.foundReportId._id
  );

  if (!foundReport) {
    const error = new Error(
      'Associated Found report not found.'
    );

    error.statusCode = 404;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Found Report Must Be CLAIM_IN_PROGRESS
  |--------------------------------------------------------------------------
  */

  if (
    !isValidFoundTransition(
      foundReport.status,
      FOUND_STATUS.RETURNED
    )
  ) {
    const error = new Error(
      `Cannot complete recovery from found status '${foundReport.status}' to '${FOUND_STATUS.RETURNED}'. Found item must be CLAIM_IN_PROGRESS.`
    );

    error.statusCode = 400;
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | Lost Report
  |--------------------------------------------------------------------------
  */

  let lostReport = null;

  if (claim.lostReportId) {
    lostReport = await LostReport.findById(
      claim.lostReportId
    );

    if (!lostReport) {
      const error = new Error(
        'Associated Lost report not found.'
      );

      error.statusCode = 404;
      throw error;
    }

    /*
    |--------------------------------------------------------------------------
    | Lost Must Be CLAIM_IN_PROGRESS
    |--------------------------------------------------------------------------
    */

    if (
      !isValidLostTransition(
        lostReport.status,
        LOST_STATUS.RECOVERED
      )
    ) {
      const error = new Error(
        `Cannot complete recovery from lost status '${lostReport.status}' to '${LOST_STATUS.RECOVERED}'. Lost report must be CLAIM_IN_PROGRESS.`
      );

      error.statusCode = 400;
      throw error;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Final Lifecycle Transitions
  |--------------------------------------------------------------------------
  */

  foundReport.status = FOUND_STATUS.RETURNED;
  await foundReport.save();

  if (lostReport) {
    lostReport.status = LOST_STATUS.RECOVERED;
    await lostReport.save();
  }

  /*
  |--------------------------------------------------------------------------
  | Resolve Related Matches
  |--------------------------------------------------------------------------
  */

  const matchFilter = {
    status: MATCH_STATUS.ACTIVE,
    $or: [
      { foundReportId: foundReport._id }
    ]
  };

  if (claim.lostReportId) {
    matchFilter.$or.push({
      lostReportId: claim.lostReportId
    });
  }

  await Match.updateMany(
    matchFilter,
    {
      $set: {
        status: MATCH_STATUS.RESOLVED
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Record Rector Completion
  |--------------------------------------------------------------------------
  */

  claim.rectorCompletedAt = new Date();
  claim.rectorCompletedBy = rector._id;

  await claim.save();

  /*
  |--------------------------------------------------------------------------
  | Notify Student
  |--------------------------------------------------------------------------
  */

  await Notification.create({
    userId: claim.claimantId,
    type: NOTIFICATION_TYPES.RECOVERY_CONFIRMED,
    title: 'Item Return Completed',
    message: `Rector completed the return of "${foundReport.itemName}". The recovery process is complete.`,
    relatedId: claim._id
  });

  return {
    success: true,
    message:
      'Item return completed successfully by Rector.',
    claim
  };
};

module.exports = {
  confirmRecoveryByStudent,
  completeRecoveryByRector
};