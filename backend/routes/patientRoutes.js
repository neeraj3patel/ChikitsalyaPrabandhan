/**
 * Patient Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getPatients,
  getPatient,
  getPatientByUserId,
  createPatient,
  updatePatient,
  deletePatient,
  addMedicalHistory,
  addAllergy
} = require('../controllers/patientController');

// All routes require authentication
router.use(protect);

// Get all patients - Admin, Doctor, Nurse, Receptionist
router.get('/', authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST), getPatients);

// Get patient by user ID
router.get('/user/:userId', getPatientByUserId);

// Get single patient
router.get('/:id', getPatient);

// Create patient - Admin, Receptionist
router.post('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), createPatient);

// Update patient
router.put('/:id', updatePatient);

// Delete patient - Admin only
router.delete('/:id', authorize(ROLES.ADMIN), deletePatient);

// Add medical history - Admin, Doctor
router.post('/:id/medical-history', authorize(ROLES.ADMIN, ROLES.DOCTOR), addMedicalHistory);

// Add allergy - Admin, Doctor
router.post('/:id/allergies', authorize(ROLES.ADMIN, ROLES.DOCTOR), addAllergy);

module.exports = router;
