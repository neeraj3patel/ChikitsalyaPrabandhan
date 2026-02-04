/**
 * Lab Test Model
 * Laboratory test management
 */

const mongoose = require('mongoose');
const { LAB_STATUS } = require('../config/constants');

const labTestSchema = new mongoose.Schema({
  testId: {
    type: String,
    unique: true
  },
  testName: {
    type: String,
    required: [true, 'Please provide test name']
  },
  testCode: {
    type: String,
    unique: true
  },
  category: {
    type: String,
    enum: ['Blood', 'Urine', 'Imaging', 'Cardiac', 'Pathology', 'Microbiology', 'Other'],
    required: true
  },
  description: String,
  price: {
    type: Number,
    required: [true, 'Please provide test price'],
    min: 0
  },
  normalRange: {
    type: String
  },
  unit: String,
  preparationInstructions: String,
  turnaroundTime: {
    type: String,
    default: '24 hours'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Lab Test Order Schema - for patient-specific tests
const labTestOrderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  opdRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OPDRecord'
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  sampleCollectedAt: Date,
  sampleCollectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: Object.values(LAB_STATUS),
    default: LAB_STATUS.PENDING
  },
  result: {
    value: String,
    unit: String,
    isAbnormal: Boolean,
    notes: String,
    attachments: [{
      name: String,
      url: String
    }]
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  priority: {
    type: String,
    enum: ['Normal', 'Urgent', 'Critical'],
    default: 'Normal'
  },
  notes: String
}, {
  timestamps: true
});

// Generate Test ID before saving
labTestSchema.pre('save', async function(next) {
  if (!this.testId) {
    const count = await mongoose.model('LabTest').countDocuments();
    this.testId = `TST${String(count + 1).padStart(6, '0')}`;
  }
  if (!this.testCode) {
    this.testCode = this.testName.substring(0, 3).toUpperCase() + Date.now().toString().slice(-4);
  }
  next();
});

// Generate Order ID before saving
labTestOrderSchema.pre('save', async function(next) {
  if (!this.orderId) {
    const count = await mongoose.model('LabTestOrder').countDocuments();
    this.orderId = `LBO${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

const LabTest = mongoose.model('LabTest', labTestSchema);
const LabTestOrder = mongoose.model('LabTestOrder', labTestOrderSchema);

module.exports = { LabTest, LabTestOrder };
