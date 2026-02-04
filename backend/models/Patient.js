/**
 * Patient Model
 * Patient-specific information linked to User
 */

const mongoose = require('mongoose');
const { BLOOD_GROUPS, GENDERS } = require('../config/constants');

const patientSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  patientId: {
    type: String,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide date of birth']
  },
  gender: {
    type: String,
    enum: GENDERS,
    required: [true, 'Please provide gender']
  },
  age: {
    type: Number,
    min: 0,
    max: 150
  },
  bloodGroup: {
    type: String,
    enum: BLOOD_GROUPS
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  allergies: [{
    type: String
  }],
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String
  }],
  insuranceInfo: {
    provider: String,
    policyNumber: String,
    validTill: Date
  },
  documents: [{
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Generate Patient ID before saving
patientSchema.pre('save', async function(next) {
  if (!this.patientId) {
    const count = await mongoose.model('Patient').countDocuments();
    this.patientId = `PAT${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate age from DOB
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
