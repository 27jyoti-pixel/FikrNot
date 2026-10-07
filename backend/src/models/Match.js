const mongoose = require('mongoose');
const { MATCH_STATUS } = require('../constants');

const matchSchema = new mongoose.Schema(
  {
    lostReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LostReport',
      required: true
    },
    foundReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoundReport',
      required: true
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    status: {
      type: String,
      enum: Object.values(MATCH_STATUS),
      default: MATCH_STATUS.ACTIVE
    }
  },
  {
    timestamps: true
  }
);

matchSchema.index({ lostReportId: 1, foundReportId: 1 }, { unique: true });
matchSchema.index({ status: 1 });

const Match = mongoose.model('Match', matchSchema);
module.exports = Match;
