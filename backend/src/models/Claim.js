const mongoose = require('mongoose');
const { CLAIM_STATUS } = require('../constants');

const claimSchema = new mongoose.Schema(
  {
    foundReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoundReport',
      required: true
    },

    lostReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostReport'
    },

    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    evidence: {
      type: String,
      required: [true, 'Evidence description or details are required'],
      trim: true
    },

    status: {
      type: String,
      enum: Object.values(CLAIM_STATUS),
      default: CLAIM_STATUS.SUBMITTED
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    reviewedAt: {
      type: Date
    },

    rejectionReason: {
      type: String,
      default: '',
      trim: true
    },

    infoRequestedReason: {
      type: String,
      default: '',
      trim: true
    },

    // Records that the student confirmed successful physical recovery.
    // This does NOT complete the Rector-side recovery workflow.
    studentConfirmedAt: {
      type: Date
    },

    studentConfirmedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Records final completion by the responsible Rector.
    rectorCompletedAt: {
      type: Date
    },

    rectorCompletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
claimSchema.index({ claimantId: 1 });
claimSchema.index({ foundReportId: 1 });
claimSchema.index({ lostReportId: 1 });
claimSchema.index({ status: 1 });

const Claim = mongoose.model('Claim', claimSchema);

module.exports = Claim;