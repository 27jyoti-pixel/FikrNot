const { LOST_STATUS, FOUND_STATUS, CLAIM_STATUS, MATCH_STATUS } = require('../constants');

const ALLOWED_LOST_TRANSITIONS = {
  [LOST_STATUS.ACTIVE]: [LOST_STATUS.MATCH_FOUND],
  [LOST_STATUS.MATCH_FOUND]: [LOST_STATUS.CLAIM_IN_PROGRESS],
  [LOST_STATUS.CLAIM_IN_PROGRESS]: [LOST_STATUS.RECOVERED],
  [LOST_STATUS.RECOVERED]: [LOST_STATUS.CLOSED],
  [LOST_STATUS.CLOSED]: []
};

const ALLOWED_FOUND_TRANSITIONS = {
  [FOUND_STATUS.REPORTED]: [FOUND_STATUS.AWAITING_HANDOVER],
  [FOUND_STATUS.AWAITING_HANDOVER]: [FOUND_STATUS.WITH_RECTOR],
  [FOUND_STATUS.WITH_RECTOR]: [FOUND_STATUS.CLAIM_IN_PROGRESS],
  [FOUND_STATUS.CLAIM_IN_PROGRESS]: [FOUND_STATUS.RETURNED],
  [FOUND_STATUS.RETURNED]: [FOUND_STATUS.CLOSED],
  [FOUND_STATUS.CLOSED]: []
};

const ALLOWED_CLAIM_TRANSITIONS = {
  [CLAIM_STATUS.SUBMITTED]: [CLAIM_STATUS.UNDER_VERIFICATION],
  [CLAIM_STATUS.UNDER_VERIFICATION]: [CLAIM_STATUS.APPROVED, CLAIM_STATUS.REJECTED],
  [CLAIM_STATUS.APPROVED]: [],
  [CLAIM_STATUS.REJECTED]: []
};

const ALLOWED_MATCH_TRANSITIONS = {
  [MATCH_STATUS.ACTIVE]: [MATCH_STATUS.INVALIDATED, MATCH_STATUS.RESOLVED],
  [MATCH_STATUS.INVALIDATED]: [],
  [MATCH_STATUS.RESOLVED]: []
};

const isValidTransition = (allowedMap, currentStatus, newStatus) => {
  if (currentStatus === newStatus) return true;
  const allowedNext = allowedMap[currentStatus] || [];
  return allowedNext.includes(newStatus);
};

const isValidLostTransition = (currentStatus, newStatus) =>
  isValidTransition(ALLOWED_LOST_TRANSITIONS, currentStatus, newStatus);

const isValidFoundTransition = (currentStatus, newStatus) =>
  isValidTransition(ALLOWED_FOUND_TRANSITIONS, currentStatus, newStatus);

const isValidClaimTransition = (currentStatus, newStatus) =>
  isValidTransition(ALLOWED_CLAIM_TRANSITIONS, currentStatus, newStatus);

const isValidMatchTransition = (currentStatus, newStatus) =>
  isValidTransition(ALLOWED_MATCH_TRANSITIONS, currentStatus, newStatus);

module.exports = {
  isValidLostTransition,
  isValidFoundTransition,
  isValidClaimTransition,
  isValidMatchTransition
};
