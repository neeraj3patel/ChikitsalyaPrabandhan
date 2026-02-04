/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getAdminDashboard,
  getDoctorDashboard,
  getPatientDashboard
} = require('../controllers/dashboardController');

// All routes require authentication
router.use(protect);

// Admin dashboard
router.get('/admin', authorize(ROLES.ADMIN), getAdminDashboard);

// Doctor dashboard
router.get('/doctor', authorize(ROLES.DOCTOR), getDoctorDashboard);

// Patient dashboard
router.get('/patient', authorize(ROLES.PATIENT), getPatientDashboard);

module.exports = router;
