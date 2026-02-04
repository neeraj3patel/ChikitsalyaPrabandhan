/**
 * Doctor Model
 * Doctor-specific information linked to User
 */

const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  doctorId: {
    type: String,
    unique: true
  },
  specialization: {
    type: String,
    required: [true, 'Please provide specialization']
  },
  department: {
    type: String,
    required: [true, 'Please provide department']
  },
  qualification: [{
    degree: String,
    institution: String,
    year: Number
  }],
  experience: {
    type: Number,
    default: 0
  },
  consultationFee: {
    type: Number,
    required: [true, 'Please provide consultation fee'],
    min: 0
  },
  availability: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: String,
    endTime: String,
    maxPatients: {
      type: Number,
      default: 20
    }
  }],
  slotDuration: {
    type: Number,
    default: 15, // minutes
    min: 5
  },
  licenseNumber: {
    type: String,
    required: [true, 'Please provide license number']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Generate Doctor ID before saving
doctorSchema.pre('save', async function(next) {
  if (!this.doctorId) {
    const count = await mongoose.model('Doctor').countDocuments();
    this.doctorId = `DOC${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
