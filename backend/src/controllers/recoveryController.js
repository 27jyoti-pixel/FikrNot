const asyncWrapper = require('../utils/asyncWrapper');
const { successResponse } = require('../utils/apiResponse');
const recoveryService = require('../services/recovery/recoveryService');

const confirmRecovery = asyncWrapper(async (req, res) => {
  const result = await recoveryService.confirmRecoveryByStudent(req.params.claimId, req.user);
  return successResponse(res, 200, result.message, result.claim);
});

const completeRecovery = asyncWrapper(async (req, res) => {
  const result = await recoveryService.completeRecoveryByRector(req.params.claimId, req.user);
  return successResponse(res, 200, result.message, result.claim);
});

module.exports = {
  confirmRecovery,
  completeRecovery
};
