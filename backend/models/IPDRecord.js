/**
 * IPD Record Model
 * Inpatient Department records - hospitalization details
 */

const mongoose = require('mongoose');
const { IPD_STATUS } = require('../config/constants');

const ipdRecordSchema = new mongoose.Schema({
  recordId: {
    type: String,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  bedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bed',
    required: true
  },
  admissionDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  dischargeDate: {
    type: Date
  },
  admissionReason: {
    type: String,
    required: [true, 'Please provide admission reason']
  },
  diagnosis: {
    primary: String,
    secondary: [String]
  },
  status: {
    type: String,
    enum: Object.values(IPD_STATUS),
    default: IPD_STATUS.ADMITTED
  },
  treatmentNotes: [{
    date: {
      type: Date,
      default: Date.now
    },
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  medications: [{
    medicine: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    administeredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  surgeries: [{
    name: String,
    date: Date,
    surgeon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor'
    },
    notes: String,
    outcome: String
  }],
  vitalRecords: [{
    date: {
      type: Date,
      default: Date.now
    },
    bloodPressure: String,
    pulse: Number,
    temperature: Number,
    oxygenSaturation: Number,
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  dischargeSummary: {
    condition: String,
    instructions: String,
    followUpDate: Date,
    medications: [{
      medicine: String,
      dosage: String,
      duration: String
    }]
  }
}, {
  timestamps: true
});

// Generate Record ID before saving
ipdRecordSchema.pre('save', async function(next) {
  if (!this.recordId) {
    const count = await mongoose.model('IPDRecord').countDocuments();
    this.recordId = `IPD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('IPDRecord', ipdRecordSchema);
