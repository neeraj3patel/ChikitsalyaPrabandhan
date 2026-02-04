/**
 * IPD Record Controller
 * Handles inpatient department records
 */

const IPDRecord = require('../models/IPDRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Bed = require('../models/Bed');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES, IPD_STATUS, BED_STATUS } = require('../config/constants');

/**
 * @desc    Get all IPD records
 * @route   GET /api/ipd
 * @access  Private
 */
exports.getIPDRecords = asyncHandler(async (req, res, next) => {
  const { status, patientId, doctorId, page = 1, limit = 10 } = req.query;

  let query = {};

  if (status) query.status = status;
  if (patientId) query.patientId = patientId;
  if (doctorId) query.doctorId = doctorId;

  // Role-based filtering
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (patient) query.patientId = patient._id;
  } else if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (doctor) query.doctorId = doctor._id;
  }

  const records = await IPDRecord.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('bedId')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ admissionDate: -1 });

  const total = await IPDRecord.countDocuments(query);

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
 * @desc    Get single IPD record
 * @route   GET /api/ipd/:id
 * @access  Private
 */
exports.getIPDRecord = asyncHandler(async (req, res, next) => {
  const record = await IPDRecord.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('bedId')
    .populate('treatmentNotes.addedBy', 'name')
    .populate('vitalRecords.recordedBy', 'name')
    .populate('surgeries.surgeon', 'userId');

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'IPD record not found'
    });
  }

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Admit patient (Create IPD record)
 * @route   POST /api/ipd/admit
 * @access  Private (Admin, Doctor, Nurse)
 */
exports.admitPatient = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, bedId, admissionReason, diagnosis } = req.body;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Verify bed exists and is available
  const bed = await Bed.findById(bedId);
  if (!bed) {
    return res.status(404).json({
      success: false,
      message: 'Bed not found'
    });
  }

  if (bed.status !== BED_STATUS.AVAILABLE) {
    return res.status(400).json({
      success: false,
      message: 'Bed is not available'
    });
  }

  // Check if patient is already admitted
  const existingAdmission = await IPDRecord.findOne({
    patientId,
    status: IPD_STATUS.ADMITTED
  });

  if (existingAdmission) {
    return res.status(400).json({
      success: false,
      message: 'Patient is already admitted'
    });
  }

  // Create IPD record
  const record = await IPDRecord.create({
    patientId,
    doctorId,
    bedId,
    admissionReason,
    diagnosis,
    status: IPD_STATUS.ADMITTED
  });

  // Update bed status
  bed.status = BED_STATUS.OCCUPIED;
  bed.currentPatient = patientId;
  await bed.save();

  const populatedRecord = await IPDRecord.findById(record._id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('bedId');

  res.status(201).json({
    success: true,
    data: populatedRecord
  });
});

/**
 * @desc    Discharge patient
 * @route   PUT /api/ipd/:id/discharge
 * @access  Private (Admin, Doctor)
 */
exports.dischargePatient = asyncHandler(async (req, res, next) => {
  const record = await IPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'IPD record not found'
    });
  }

  if (record.status !== IPD_STATUS.ADMITTED) {
    return res.status(400).json({
      success: false,
      message: 'Patient is not currently admitted'
    });
  }

  // Update record
  record.status = IPD_STATUS.DISCHARGED;
  record.dischargeDate = new Date();
  record.dischargeSummary = req.body.dischargeSummary;
  await record.save();

  // Free up the bed
  await Bed.findByIdAndUpdate(record.bedId, {
    status: BED_STATUS.AVAILABLE,
    currentPatient: null
  });

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Add treatment note
 * @route   POST /api/ipd/:id/notes
 * @access  Private (Doctor, Nurse)
 */
exports.addTreatmentNote = asyncHandler(async (req, res, next) => {
  const record = await IPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'IPD record not found'
    });
  }

  record.treatmentNotes.push({
    note: req.body.note,
    addedBy: req.user.id
  });
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Add vital records
 * @route   POST /api/ipd/:id/vitals
 * @access  Private (Doctor, Nurse)
 */
exports.addVitalRecord = asyncHandler(async (req, res, next) => {
  const record = await IPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'IPD record not found'
    });
  }

  record.vitalRecords.push({
    ...req.body,
    recordedBy: req.user.id
  });
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Add medication
 * @route   POST /api/ipd/:id/medication
 * @access  Private (Doctor)
 */
exports.addMedication = asyncHandler(async (req, res, next) => {
  const record = await IPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'IPD record not found'
    });
  }

  record.medications.push({
    ...req.body,
    administeredBy: req.user.id
  });
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Transfer patient to another bed
 * @route   PUT /api/ipd/:id/transfer
 * @access  Private (Admin, Nurse)
 */
exports.transferPatient = asyncHandler(async (req, res, next) => {
  const { newBedId } = req.body;

  const record = await IPDRecord.findById(req.params.id);

  if (!record) {
    return res.status(404).json({
      success: false,
      message: 'IPD record not found'
    });
  }

  // Verify new bed is available
  const newBed = await Bed.findById(newBedId);
  if (!newBed || newBed.status !== BED_STATUS.AVAILABLE) {
    return res.status(400).json({
      success: false,
      message: 'New bed is not available'
    });
  }

  // Free old bed
  await Bed.findByIdAndUpdate(record.bedId, {
    status: BED_STATUS.AVAILABLE,
    currentPatient: null
  });

  // Assign new bed
  newBed.status = BED_STATUS.OCCUPIED;
  newBed.currentPatient = record.patientId;
  await newBed.save();

  // Update record
  record.bedId = newBedId;
  record.treatmentNotes.push({
    note: `Patient transferred from bed ${record.bedId} to bed ${newBedId}`,
    addedBy: req.user.id
  });
  await record.save();

  res.status(200).json({
    success: true,
    data: record
  });
});

/**
 * @desc    Get currently admitted patients count
 * @route   GET /api/ipd/stats
 * @access  Private (Admin)
 */
exports.getIPDStats = asyncHandler(async (req, res, next) => {
  const admitted = await IPDRecord.countDocuments({ status: IPD_STATUS.ADMITTED });
  const dischargedToday = await IPDRecord.countDocuments({
    status: IPD_STATUS.DISCHARGED,
    dischargeDate: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });
  const admittedToday = await IPDRecord.countDocuments({
    admissionDate: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lte: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });

  res.status(200).json({
    success: true,
    data: {
      currentlyAdmitted: admitted,
      admittedToday,
      dischargedToday
    }
  });
});
