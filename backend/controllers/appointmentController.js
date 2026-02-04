/**
 * Appointment Controller
 * Handles appointment scheduling and management
 */

const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES, APPOINTMENT_STATUS } = require('../config/constants');

/**
 * @desc    Get all appointments
 * @route   GET /api/appointments
 * @access  Private
 */
exports.getAppointments = asyncHandler(async (req, res, next) => {
  const { 
    status, 
    doctorId, 
    patientId, 
    date, 
    startDate, 
    endDate,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  let query = {};

  if (status) query.status = status;
  if (doctorId) query.doctorId = doctorId;
  if (patientId) query.patientId = patientId;
  
  // Date filtering
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.date = { $gte: startOfDay, $lte: endOfDay };
  } else if (startDate && endDate) {
    query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Role-based filtering
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (patient) {
      query.patientId = patient._id;
    }
  } else if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (doctor) {
      query.doctorId = doctor._id;
    }
  }

  const appointments = await Appointment.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ date: -1, time: 1 });

  const total = await Appointment.countDocuments(query);

  res.status(200).json({
    success: true,
    count: appointments.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: appointments
  });
});

/**
 * @desc    Get single appointment
 * @route   GET /api/appointments/:id
 * @access  Private
 */
exports.getAppointment = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email phone' }
    });

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check authorization
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient || appointment.patientId._id.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: appointment
  });
});

/**
 * @desc    Create appointment
 * @route   POST /api/appointments
 * @access  Private
 */
exports.createAppointment = asyncHandler(async (req, res, next) => {
  const { patientId, doctorId, date, time, type, symptoms, notes } = req.body;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Verify doctor exists
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Check if slot is available
  const appointmentDate = new Date(date);
  const startOfDay = new Date(appointmentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(appointmentDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existingAppointment = await Appointment.findOne({
    doctorId,
    date: { $gte: startOfDay, $lte: endOfDay },
    time,
    status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
  });

  if (existingAppointment) {
    return res.status(400).json({
      success: false,
      message: 'This time slot is already booked'
    });
  }

  // Create appointment
  const appointment = await Appointment.create({
    patientId,
    doctorId,
    date: appointmentDate,
    time,
    type: type || 'Consultation',
    symptoms,
    notes,
    fee: doctor.consultationFee
  });

  const populatedAppointment = await Appointment.findById(appointment._id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email phone' }
    });

  res.status(201).json({
    success: true,
    data: populatedAppointment
  });
});

/**
 * @desc    Update appointment
 * @route   PUT /api/appointments/:id
 * @access  Private
 */
exports.updateAppointment = asyncHandler(async (req, res, next) => {
  let appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  // Check if rescheduling - verify new slot availability
  if (req.body.date || req.body.time) {
    const newDate = req.body.date || appointment.date;
    const newTime = req.body.time || appointment.time;
    
    const appointmentDate = new Date(newDate);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      _id: { $ne: req.params.id },
      doctorId: appointment.doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      time: newTime,
      status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
  }

  appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email phone' }
    });

  res.status(200).json({
    success: true,
    data: appointment
  });
});

/**
 * @desc    Cancel appointment
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private
 */
exports.cancelAppointment = asyncHandler(async (req, res, next) => {
  let appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  if (appointment.status === APPOINTMENT_STATUS.COMPLETED) {
    return res.status(400).json({
      success: false,
      message: 'Cannot cancel a completed appointment'
    });
  }

  appointment.status = APPOINTMENT_STATUS.CANCELLED;
  appointment.cancelReason = req.body.reason;
  appointment.cancelledBy = req.user.id;
  await appointment.save();

  res.status(200).json({
    success: true,
    data: appointment
  });
});

/**
 * @desc    Complete appointment
 * @route   PUT /api/appointments/:id/complete
 * @access  Private (Doctor only)
 */
exports.completeAppointment = asyncHandler(async (req, res, next) => {
  let appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: 'Appointment not found'
    });
  }

  appointment.status = APPOINTMENT_STATUS.COMPLETED;
  await appointment.save();

  res.status(200).json({
    success: true,
    data: appointment
  });
});

/**
 * @desc    Get today's appointments for logged in doctor
 * @route   GET /api/appointments/today
 * @access  Private (Doctor)
 */
exports.getTodayAppointments = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  let query = {
    date: { $gte: startOfDay, $lte: endOfDay }
  };

  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (doctor) {
      query.doctorId = doctor._id;
    }
  }

  const appointments = await Appointment.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .sort({ time: 1 });

  res.status(200).json({
    success: true,
    count: appointments.length,
    data: appointments
  });
});

/**
 * @desc    Get appointment statistics
 * @route   GET /api/appointments/stats
 * @access  Private (Admin)
 */
exports.getAppointmentStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const totalToday = await Appointment.countDocuments({
    date: { $gte: startOfDay, $lte: endOfDay }
  });

  const completed = await Appointment.countDocuments({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: APPOINTMENT_STATUS.COMPLETED
  });

  const pending = await Appointment.countDocuments({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
  });

  const cancelled = await Appointment.countDocuments({
    date: { $gte: startOfDay, $lte: endOfDay },
    status: APPOINTMENT_STATUS.CANCELLED
  });

  res.status(200).json({
    success: true,
    data: {
      today: totalToday,
      completed,
      pending,
      cancelled
    }
  });
});
