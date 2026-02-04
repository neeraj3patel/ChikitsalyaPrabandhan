/**
 * Patient Controller
 * Handles all patient-related operations
 */

const Patient = require('../models/Patient');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES } = require('../config/constants');

/**
 * @desc    Get all patients
 * @route   GET /api/patients
 * @access  Private (Admin, Doctor, Nurse, Receptionist)
 */
exports.getPatients = asyncHandler(async (req, res, next) => {
  const { search, bloodGroup, gender, page = 1, limit = 10 } = req.query;

  // Build query
  let query = {};

  if (bloodGroup) query.bloodGroup = bloodGroup;
  if (gender) query.gender = gender;

  // If search, search by patient ID or user name
  let userIds = [];
  if (search) {
    const users = await User.find({
      name: { $regex: search, $options: 'i' },
      role: ROLES.PATIENT
    }).select('_id');
    userIds = users.map(u => u._id);
    query.$or = [
      { patientId: { $regex: search, $options: 'i' } },
      { userId: { $in: userIds } }
    ];
  }

  const patients = await Patient.find(query)
    .populate('userId', 'name email phone address profileImage')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  const total = await Patient.countDocuments(query);

  res.status(200).json({
    success: true,
    count: patients.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: patients
  });
});

/**
 * @desc    Get single patient
 * @route   GET /api/patients/:id
 * @access  Private
 */
exports.getPatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id)
    .populate('userId', 'name email phone address profileImage');

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Check authorization - patient can only view their own profile
  if (req.user.role === ROLES.PATIENT) {
    if (patient.userId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this patient'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Get patient by user ID
 * @route   GET /api/patients/user/:userId
 * @access  Private
 */
exports.getPatientByUserId = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ userId: req.params.userId })
    .populate('userId', 'name email phone address profileImage');

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Create patient
 * @route   POST /api/patients
 * @access  Private (Admin, Receptionist)
 */
exports.createPatient = asyncHandler(async (req, res, next) => {
  const { userData, patientData } = req.body;

  // Validate required data
  if (!userData || !userData.name || !userData.email || !userData.password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email and password for the user'
    });
  }

  // Create user first
  const user = await User.create({
    ...userData,
    role: ROLES.PATIENT
  });

  // Create patient profile
  const patient = await Patient.create({
    ...patientData,
    userId: user._id
  });

  const populatedPatient = await Patient.findById(patient._id)
    .populate('userId', 'name email phone address');

  res.status(201).json({
    success: true,
    data: populatedPatient
  });
});

/**
 * @desc    Update patient
 * @route   PUT /api/patients/:id
 * @access  Private
 */
exports.updatePatient = asyncHandler(async (req, res, next) => {
  let patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Check authorization
  if (req.user.role === ROLES.PATIENT) {
    if (patient.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this patient'
      });
    }
  }

  // Update user data if provided
  if (req.body.userData) {
    await User.findByIdAndUpdate(patient.userId, req.body.userData, {
      new: true,
      runValidators: true
    });
  }

  // Update patient data
  patient = await Patient.findByIdAndUpdate(req.params.id, req.body.patientData || req.body, {
    new: true,
    runValidators: true
  }).populate('userId', 'name email phone address profileImage');

  res.status(200).json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Delete patient
 * @route   DELETE /api/patients/:id
 * @access  Private (Admin only)
 */
exports.deletePatient = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Soft delete - deactivate user
  await User.findByIdAndUpdate(patient.userId, { isActive: false });

  res.status(200).json({
    success: true,
    message: 'Patient deleted successfully'
  });
});

/**
 * @desc    Add medical history
 * @route   POST /api/patients/:id/medical-history
 * @access  Private (Admin, Doctor)
 */
exports.addMedicalHistory = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  patient.medicalHistory.push(req.body);
  await patient.save();

  res.status(200).json({
    success: true,
    data: patient
  });
});

/**
 * @desc    Add allergy
 * @route   POST /api/patients/:id/allergies
 * @access  Private (Admin, Doctor)
 */
exports.addAllergy = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  if (!patient.allergies.includes(req.body.allergy)) {
    patient.allergies.push(req.body.allergy);
    await patient.save();
  }

  res.status(200).json({
    success: true,
    data: patient
  });
});
