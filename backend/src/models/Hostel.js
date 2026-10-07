const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Hostel name is required'],
      trim: true,
      unique: true
    },
    capacity: {
      type: Number,
      required: [true, 'Hostel capacity is required'],
      min: [1, 'Hostel capacity must be at least 1']
    },
    rectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      },
      area: {
        type: String,
        required: true,
        trim: true
      }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

hostelSchema.index({ rectorId: 1 });
hostelSchema.index({ location: '2dsphere' });

const Hostel = mongoose.model('Hostel', hostelSchema);

module.exports = Hostel;