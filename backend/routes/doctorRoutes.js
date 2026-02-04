/**
 * Doctor Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getDoctors,
  getDoctor,
  getDoctorByUserId,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  updateAvailability,
  getAvailableSlots,
  getSpecializations,
  getDepartments
} = require('../controllers/doctorController');

// Public routes
router.get('/', getDoctors);
router.get('/specializations', getSpecializations);
router.get('/departments', getDepartments);
router.get('/:id', getDoctor);
router.get('/:id/slots', getAvailableSlots);

// Protected routes
router.use(protect);

router.get('/user/:userId', getDoctorByUserId);

// Admin only routes
router.post('/', authorize(ROLES.ADMIN), createDoctor);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.DOCTOR), updateDoctor);
router.delete('/:id', authorize(ROLES.ADMIN), deleteDoctor);
router.put('/:id/availability', authorize(ROLES.ADMIN, ROLES.DOCTOR), updateAvailability);

module.exports = router;
