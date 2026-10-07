const mongoose = require('mongoose');
const { CATEGORIES, LOST_STATUS, MODERATION_ACTION } = require('../constants');

const lostReportSchema = new mongoose.Schema(
  {
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hostel',
      required: true
    },

    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required']
    },

    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },

    brand: {
      type: String,
      trim: true,
      default: ''
    },

    color: {
      type: String,
      trim: true,
      default: ''
    },

    description: {
      type: String,
      trim: true,
      default: ''
    },

    images: [
      {
        url: {
          type: String,
          required: true
        },
        publicId: {
          type: String,
          default: ''
        }
      }
    ],

    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: undefined
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: false
      },
      area: {
        type: String,
        required: true,
        trim: true
      }
    },

    lostAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: Object.values(LOST_STATUS),
      default: LOST_STATUS.ACTIVE
    },

    moderation: {
      isFlagged: {
        type: Boolean,
        default: false
      },

      action: {
        type: String,
        enum: Object.values(MODERATION_ACTION),
        default: MODERATION_ACTION.NONE
      },

      reason: {
        type: String,
        default: ''
      },

      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },

      moderatedAt: {
        type: Date
      }
    },

    cancellation: {
      isCancelled: {
        type: Boolean,
        default: false
      },

      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },

      cancelledAt: {
        type: Date
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
lostReportSchema.index({ hostelId: 1 });
lostReportSchema.index({ category: 1 });
lostReportSchema.index({ status: 1 });
lostReportSchema.index({ reportedBy: 1 });
lostReportSchema.index({ createdAt: -1 });
lostReportSchema.index(
  { location: '2dsphere' },
  { partialFilterExpression: { 'location.coordinates': { $exists: true } } }
);

const LostReport = mongoose.model('LostReport', lostReportSchema);

module.exports = LostReport;
