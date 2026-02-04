/**
 * IPD Record Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getIPDRecords,
  getIPDRecord,
  admitPatient,
  dischargePatient,
  addTreatmentNote,
  addVitalRecord,
  addMedication,
  transferPatient,
  getIPDStats
} = require('../controllers/ipdController');

// All routes require authentication
router.use(protect);

// Get IPD stats - Admin only
router.get('/stats', authorize(ROLES.ADMIN), getIPDStats);

// Get all IPD records
router.get('/', getIPDRecords);

// Get single IPD record
router.get('/:id', getIPDRecord);

// Admit patient - Admin, Doctor, Nurse
router.post('/admit', authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE), admitPatient);

// Discharge patient - Admin, Doctor
router.put('/:id/discharge', authorize(ROLES.ADMIN, ROLES.DOCTOR), dischargePatient);

// Add treatment note - Doctor, Nurse
router.post('/:id/notes', authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE), addTreatmentNote);

// Add vital records - Doctor, Nurse
router.post('/:id/vitals', authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE), addVitalRecord);

// Add medication - Doctor
router.post('/:id/medication', authorize(ROLES.ADMIN, ROLES.DOCTOR), addMedication);

// Transfer patient - Admin, Nurse
router.put('/:id/transfer', authorize(ROLES.ADMIN, ROLES.NURSE), transferPatient);

module.exports = router;
