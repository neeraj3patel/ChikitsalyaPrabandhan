/**
 * Bed/Ward Model
 * Hospital bed and ward management
 */

const mongoose = require('mongoose');
const { BED_STATUS } = require('../config/constants');

const bedSchema = new mongoose.Schema({
  bedNumber: {
    type: String,
    required: [true, 'Please provide bed number'],
    unique: true
  },
  ward: {
    type: String,
    required: [true, 'Please provide ward name']
  },
  wardType: {
    type: String,
    enum: ['General', 'Private', 'Semi-Private', 'ICU', 'Emergency', 'Pediatric', 'Maternity'],
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(BED_STATUS),
    default: BED_STATUS.AVAILABLE
  },
  currentPatient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    default: null
  },
  dailyRate: {
    type: Number,
    required: [true, 'Please provide daily rate'],
    min: 0
  },
  facilities: [{
    type: String
  }],
  lastCleanedAt: {
    type: Date
  },
  notes: String
}, {
  timestamps: true
});

// Index for quick availability checks
bedSchema.index({ status: 1, wardType: 1 });

module.exports = mongoose.model('Bed', bedSchema);
