const mongoose = require('mongoose');
const { CATEGORIES, FOUND_STATUS, MODERATION_ACTION } = require('../constants');

const foundReportSchema = new mongoose.Schema(
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

    foundAt: {
      type: Date,
      default: Date.now
    },

    status: {
      type: String,
      enum: Object.values(FOUND_STATUS),
      default: FOUND_STATUS.REPORTED
    },

    // Rector responsible for receiving and managing the physical item
    rectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    receivedAt: {
      type: Date
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

    // Cancellation metadata.
    // Cancellation does NOT create a new lifecycle status.
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
foundReportSchema.index({ hostelId: 1 });
foundReportSchema.index({ category: 1 });
foundReportSchema.index({ status: 1 });
foundReportSchema.index({ reportedBy: 1 });
foundReportSchema.index({ rectorId: 1 });
foundReportSchema.index({ createdAt: -1 });
foundReportSchema.index(
  { location: '2dsphere' },
  { partialFilterExpression: { 'location.coordinates': { $exists: true } } }
);

const FoundReport = mongoose.model('FoundReport', foundReportSchema);

module.exports = FoundReport;
