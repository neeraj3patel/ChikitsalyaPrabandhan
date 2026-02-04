/**
 * Appointment Routes
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { ROLES } = require('../config/constants');
const {
  getAppointments,
  getAppointment,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  getTodayAppointments,
  getAppointmentStats
} = require('../controllers/appointmentController');

// Validation rules
const createAppointmentValidation = [
  body('patientId').notEmpty().withMessage('Patient ID is required'),
  body('doctorId').notEmpty().withMessage('Doctor ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('time').notEmpty().withMessage('Time is required')
];

// All routes require authentication
router.use(protect);

// Get appointment stats - Admin only
router.get('/stats', authorize(ROLES.ADMIN), getAppointmentStats);

// Get today's appointments
router.get('/today', getTodayAppointments);

// Get all appointments
router.get('/', getAppointments);

// Get single appointment
router.get('/:id', getAppointment);

// Create appointment
router.post('/', createAppointmentValidation, validate, createAppointment);

// Update appointment
router.put('/:id', updateAppointment);

// Cancel appointment
router.put('/:id/cancel', cancelAppointment);

// Complete appointment - Doctor only
router.put('/:id/complete', authorize(ROLES.ADMIN, ROLES.DOCTOR), completeAppointment);

module.exports = router;
