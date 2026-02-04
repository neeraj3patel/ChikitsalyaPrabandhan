/**
 * OPD Record Model
 * Outpatient Department records - consultation details
 */

const mongoose = require('mongoose');

const opdRecordSchema = new mongoose.Schema({
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
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  visitDate: {
    type: Date,
    default: Date.now
  },
  symptoms: [{
    type: String
  }],
  vitalSigns: {
    bloodPressure: String,
    pulse: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    oxygenSaturation: Number
  },
  diagnosis: {
    primary: String,
    secondary: [String],
    notes: String
  },
  prescription: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String,
    instructions: String
  }],
  labTests: [{
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest'
    },
    status: {
      type: String,
      enum: ['Ordered', 'Completed', 'Cancelled'],
      default: 'Ordered'
    }
  }],
  followUpDate: {
    type: Date
  },
  treatmentNotes: {
    type: String
  },
  attachments: [{
    name: String,
    url: String
  }]
}, {
  timestamps: true
});

// Generate Record ID before saving
opdRecordSchema.pre('save', async function(next) {
  if (!this.recordId) {
    const count = await mongoose.model('OPDRecord').countDocuments();
    this.recordId = `OPD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('OPDRecord', opdRecordSchema);
