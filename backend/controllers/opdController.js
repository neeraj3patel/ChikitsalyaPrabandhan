/**
 * OPD Record Controller
 * Handles outpatient department records
 */

const OPDRecord = require('../models/OPDRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES, APPOINTMENT_STATUS } = require('../config/constants');

/**
 * @desc    Get all OPD records
 * @route   GET /api/opd
 * @access  Private
 */
exports.getOPDRecords = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, startDate, endDate, page = 1, limit = 10 } = req.query;

  let query = {};

  if (patientId) query.patientId = patientId;
  if (doctorId) query.doctorId = doctorId;
  if (startDate && endDate) {
    query.visitDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Role-based filtering
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (patient) query.patientId = patient._id;
  } else if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (doctor) query.doctorId = doctor._id;
  }

  const records = await OPDRecord.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ visitDate: -1 });

  const total = await OPDRecord.countDocuments(query);

  res.status(200).json({
    success: true,
    count: records.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: records
  });
});

/**
 * @desc    Get single OPD record
 * @route   GET /api/opd/:id
 * @access  Private
 */
exports.getOPDRecord = asyncHandler(async (req, res, next) => {
  const record = await OPDRecord.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('labTests.test');

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OPD record not found'
    });
  }

  // Check authorization for patients
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient || record.patientId._id.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this record'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Create OPD record
 * @route   POST /api/opd
 * @access  Private (Doctor, Admin)
 */
exports.createOPDRecord = asyncHandler(async (req, res, next) => {
  const { 
    patientId, 
    appointmentId, 
    symptoms, 
    vitalSigns, 
    diagnosis, 
    prescription,
    followUpDate,
    treatmentNotes
  } = req.body;

  // Get doctor ID
  let doctorId = req.body.doctorId;
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (doctor) doctorId = doctor._id;
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Create OPD record
  const record = await OPDRecord.create({
    patientId,
    doctorId,
    appointmentId,
    symptoms,
    vitalSigns,
    diagnosis,
    prescription,
    followUpDate,
    treatmentNotes
  });

  // Update appointment status if linked
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: APPOINTMENT_STATUS.COMPLETED,
      prescription: record._id
    });
  }

  const populatedRecord = await OPDRecord.findById(record._id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    });

  res.status(201).json({
    success: true,
    data: populatedRecord
  });
});

/**
 * @desc    Update OPD record
 * @route   PUT /api/opd/:id
 * @access  Private (Doctor, Admin)
 */
exports.updateOPDRecord = asyncHandler(async (req, res, next) => {
  let record = await OPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OPD record not found'
    });
  }

  record = await OPDRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    });

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Delete OPD record
 * @route   DELETE /api/opd/:id
 * @access  Private (Admin only)
 */
exports.deleteOPDRecord = asyncHandler(async (req, res, next) => {
  const record = await OPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OPD record not found'
    });
  }

  await record.deleteOne();

  res.status(200).json({
    success: true,
    message: 'OPD record deleted successfully'
  });
});

/**
 * @desc    Get patient's OPD history
 * @route   GET /api/opd/patient/:patientId
 * @access  Private
 */
exports.getPatientOPDHistory = asyncHandler(async (req, res, next) => {
  const records = await OPDRecord.find({ patientId: req.params.patientId })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ visitDate: -1 });

  res.status(200).json({
    success: true,
    count: records.length,
    data: records
  });
});

/**
 * @desc    Add prescription to OPD record
 * @route   POST /api/opd/:id/prescription
 * @access  Private (Doctor)
 */
exports.addPrescription = asyncHandler(async (req, res, next) => {
  const record = await OPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'OPD record not found'
    });
  }

  record.prescription.push(req.body);
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});
