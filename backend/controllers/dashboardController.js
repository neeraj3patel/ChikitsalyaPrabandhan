/**
 * Dashboard Controller
 * Dashboard statistics for different roles
 */

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const IPDRecord = require('../models/IPDRecord');
const Bed = require('../models/Bed');
const Billing = require('../models/Billing');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES, APPOINTMENT_STATUS, IPD_STATUS, BED_STATUS, PAYMENT_STATUS } = require('../config/constants');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/dashboard/admin
 * @access  Private (Admin)
 */
exports.getAdminDashboard = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // User stats
  const totalPatients = await Patient.countDocuments();
  const totalDoctors = await Doctor.countDocuments();
  const totalStaff = await User.countDocuments({
    role: { $in: [ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.LAB, ROLES.PHARMACY] }
  });

  // Today's appointments
  const todayAppointments = await Appointment.countDocuments({
    date: { $gte: today, $lt: tomorrow }
  });

  // IPD stats
  const currentlyAdmitted = await IPDRecord.countDocuments({ status: IPD_STATUS.ADMITTED });

  // Bed occupancy
  const totalBeds = await Bed.countDocuments();
  const occupiedBeds = await Bed.countDocuments({ status: BED_STATUS.OCCUPIED });

  // Today's revenue
  const todayBills = await Billing.find({
    invoiceDate: { $gte: today, $lt: tomorrow }
  });
  const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.paidAmount, 0);

  // Pending payments
  const pendingPayments = await Billing.aggregate([
    { 
      $match: { 
        paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$balanceAmount' }
      }
    }
  ]);

  // Recent appointments
  const recentAppointments = await Appointment.find()
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ createdAt: -1 })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalPatients,
        totalDoctors,
        totalStaff,
        todayAppointments,
        currentlyAdmitted,
        bedOccupancy: {
          total: totalBeds,
          occupied: occupiedBeds,
          available: totalBeds - occupiedBeds,
          rate: totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0
        },
        todayRevenue,
        pendingPayments: pendingPayments[0]?.total || 0
      },
      recentAppointments
    }
  });
});

/**
 * @desc    Get doctor dashboard stats
 * @route   GET /api/dashboard/doctor
 * @access  Private (Doctor)
 */
exports.getDoctorDashboard = asyncHandler(async (req, res, next) => {
  const doctor = await Doctor.findOne({ userId: req.user.id });

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: 'Doctor profile not found'
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's appointments
  const todayAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: { $gte: today, $lt: tomorrow }
  })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name phone' }
    })
    .sort({ time: 1 });

  const completed = todayAppointments.filter(a => a.status === APPOINTMENT_STATUS.COMPLETED).length;
  const pending = todayAppointments.filter(a => 
    [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED].includes(a.status)
  ).length;

  // Total patients treated
  const totalPatients = await Appointment.distinct('patientId', { 
    doctorId: doctor._id,
    status: APPOINTMENT_STATUS.COMPLETED
  });

  // My IPD patients
  const ipdPatients = await IPDRecord.countDocuments({ 
    doctorId: doctor._id,
    status: IPD_STATUS.ADMITTED
  });

  // Upcoming appointments (next 7 days)
  const weekLater = new Date(today);
  weekLater.setDate(weekLater.getDate() + 7);
  
  const upcomingAppointments = await Appointment.find({
    doctorId: doctor._id,
    date: { $gt: tomorrow, $lte: weekLater },
    status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
  })
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ date: 1, time: 1 })
    .limit(10);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        todayTotal: todayAppointments.length,
        completed,
        pending,
        totalPatients: totalPatients.length,
        ipdPatients
      },
      todayAppointments,
      upcomingAppointments
    }
  });
});

/**
 * @desc    Get patient dashboard stats
 * @route   GET /api/dashboard/patient
 * @access  Private (Patient)
 */
exports.getPatientDashboard = asyncHandler(async (req, res, next) => {
  const patient = await Patient.findOne({ userId: req.user.id })
    .populate('userId', 'name email phone');

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient profile not found'
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Upcoming appointments
  const upcomingAppointments = await Appointment.find({
    patientId: patient._id,
    date: { $gte: today },
    status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
  })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ date: 1, time: 1 })
    .limit(5);

  // Recent visits
  const recentVisits = await Appointment.find({
    patientId: patient._id,
    status: APPOINTMENT_STATUS.COMPLETED
  })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ date: -1 })
    .limit(5);

  // Pending bills
  const pendingBills = await Billing.find({
    patientId: patient._id,
    paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL] }
  }).sort({ invoiceDate: -1 });

  const totalDue = pendingBills.reduce((sum, bill) => sum + bill.balanceAmount, 0);

  // Medical records count
  const OPDRecord = require('../models/OPDRecord');
  const recordsCount = await OPDRecord.countDocuments({ patientId: patient._id });

  res.status(200).json({
    success: true,
    data: {
      patient,
      stats: {
        upcomingAppointmentsCount: upcomingAppointments.length,
        totalVisits: await Appointment.countDocuments({ 
          patientId: patient._id,
          status: APPOINTMENT_STATUS.COMPLETED
        }),
        medicalRecords: recordsCount,
        pendingBillsCount: pendingBills.length,
        totalDue
      },
      upcomingAppointments,
      recentVisits,
      pendingBills
    }
  });
});
