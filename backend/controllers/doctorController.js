/**
 * Doctor Controller
 * Handles all doctor-related operations
 */

const Doctor = require('../models/Doctor');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES } = require('../config/constants');

/**
 * @desc    Get all doctors
 * @route   GET /api/doctors
 * @access  Public
 */
exports.getDoctors = asyncHandler(async (req, res, next) => {
  const { 
    search, 
    specialization, 
    department, 
    isAvailable,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  let query = {};

  if (specialization) query.specialization = { $regex: specialization, $options: 'i' };
  if (department) query.department = { $regex: department, $options: 'i' };
  if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

  // If search, search by doctor ID or user name
  if (search) {
    const users = await User.find({
      name: { $regex: search, $options: 'i' },
      role: ROLES.DOCTOR
    }).select('_id');
    const userIds = users.map(u => u._id);
    query.$or = [
      { doctorId: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { userId: { $in: userIds } }
    ];
  }

  const doctors = await Doctor.find(query)
    .populate('userId', 'name email phone address profileImage isActive')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  // Filter out inactive users
  const activeDoctors = doctors.filter(doc => doc.userId && doc.userId.isActive);

  const total = await Doctor.countDocuments(query);

  res.status(200).json({
    success: true,
    count: activeDoctors.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: activeDoctors
  });
});

/**
 * @desc    Get single doctor
 * @route   GET /api/doctors/:id
 * @access  Public
 */
exports.getDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id)
    .populate('userId', 'name email phone address profileImage');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: doctor
  });
});

/**
 * @desc    Get doctor by user ID
 * @route   GET /api/doctors/user/:userId
 * @access  Private
 */
exports.getDoctorByUserId = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ userId: req.params.userId })
    .populate('userId', 'name email phone address profileImage');

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  res.status(200).json({
    success: true,
    data: doctor
  });
});

/**
 * @desc    Create doctor
 * @route   POST /api/doctors
 * @access  Private (Admin only)
 */
exports.createDoctor = asyncHandler(async (req, res, next) => {
  const { userData, doctorData } = req.body;

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
    role: ROLES.DOCTOR
  });

  // Create doctor profile
  const doctor = await Doctor.create({
    ...doctorData,
    userId: user._id
  });

  const populatedDoctor = await Doctor.findById(doctor._id)
    .populate('userId', 'name email phone address');

  res.status(201).json({
    success: true,
    data: populatedDoctor
  });
});

/**
 * @desc    Update doctor
 * @route   PUT /api/doctors/:id
 * @access  Private (Admin, Doctor themselves)
 */
exports.updateDoctor = asyncHandler(async (req, res, next) => {
  let doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Check authorization
  if (req.user.role === ROLES.DOCTOR) {
    if (doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this doctor'
      });
    }
  }

  // Update user data if provided
  if (req.body.userData) {
    await User.findByIdAndUpdate(doctor.userId, req.body.userData, {
      new: true,
      runValidators: true
    });
  }

  // Update doctor data
  doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body.doctorData || req.body, {
    new: true,
    runValidators: true
  }).populate('userId', 'name email phone address profileImage');

  res.status(200).json({
    success: true,
    data: doctor
  });
});

/**
 * @desc    Delete doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private (Admin only)
 */
exports.deleteDoctor = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Soft delete - deactivate user
  await User.findByIdAndUpdate(doctor.userId, { isActive: false });

  res.status(200).json({
    success: true,
    message: 'Doctor deleted successfully'
  });
});

/**
 * @desc    Update doctor availability
 * @route   PUT /api/doctors/:id/availability
 * @access  Private (Admin, Doctor themselves)
 */
exports.updateAvailability = asyncHandler(async (req, res, next) => {
  let doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  // Check authorization
  if (req.user.role === ROLES.DOCTOR) {
    if (doctor.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this doctor'
      });
    }
  }

  doctor.availability = req.body.availability;
  await doctor.save();

  res.status(200).json({
    success: true,
    data: doctor
  });
});

/**
 * @desc    Get doctor's available slots for a date
 * @route   GET /api/doctors/:id/slots
 * @access  Public
 */
exports.getAvailableSlots = asyncHandler(async (req, res, next) => {
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a date'
    });
  }

  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor not found'
    });
  }

  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

  // Find availability for the day
  const dayAvailability = doctor.availability.find(a => a.day === dayName);

  if (!dayAvailability) {
    return res.status(200).json({
      success: true,
      data: {
        available: false,
        message: `Doctor is not available on ${dayName}`,
        slots: []
      }
    });
  }

  // Generate time slots
  const slots = generateTimeSlots(
    dayAvailability.startTime,
    dayAvailability.endTime,
    doctor.slotDuration
  );

  // Get booked appointments for the date
  const Appointment = require('../models/Appointment');
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['SCHEDULED', 'CONFIRMED'] }
  }).select('time');

  const bookedTimes = bookedAppointments.map(a => a.time);

  // Mark slots as available or booked
  const slotsWithAvailability = slots.map(slot => ({
    time: slot,
    available: !bookedTimes.includes(slot)
  }));

  res.status(200).json({
    success: true,
    data: {
      available: true,
      date: date,
      day: dayName,
      slots: slotsWithAvailability
    }
  });
});

// Helper function to generate time slots
function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  let current = parseTime(startTime);
  const end = parseTime(endTime);

  while (current < end) {
    slots.push(formatTime(current));
    current += duration;
  }

  return slots;
}

function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * @desc    Get all specializations
 * @route   GET /api/doctors/specializations
 * @access  Public
 */
exports.getSpecializations = asyncHandler(async (req, res, next) => {
  const specializations = await Doctor.distinct('specialization');

  res.status(200).json({
    success: true,
    data: specializations
  });
});

/**
 * @desc    Get all departments
 * @route   GET /api/doctors/departments
 * @access  Public
 */
exports.getDepartments = asyncHandler(async (req, res, next) => {
  const departments = await Doctor.distinct('department');

  res.status(200).json({
    success: true,
    data: departments
  });
});
