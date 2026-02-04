/**
 * OPD Record Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getOPDRecords,
  getOPDRecord,
  createOPDRecord,
  updateOPDRecord,
  deleteOPDRecord,
  getPatientOPDHistory,
  addPrescription
} = require('../controllers/opdController');

// All routes require authentication
router.use(protect);

// Get all OPD records
router.get('/', getOPDRecords);

// Get patient's OPD history
router.get('/patient/:patientId', getPatientOPDHistory);

// Get single OPD record
router.get('/:id', getOPDRecord);

// Create OPD record - Doctor, Admin
router.post('/', authorize(ROLES.ADMIN, ROLES.DOCTOR), createOPDRecord);

// Update OPD record - Doctor, Admin
router.put('/:id', authorize(ROLES.ADMIN, ROLES.DOCTOR), updateOPDRecord);

// Delete OPD record - Admin only
router.delete('/:id', authorize(ROLES.ADMIN), deleteOPDRecord);

// Add prescription - Doctor
router.post('/:id/prescription', authorize(ROLES.DOCTOR), addPrescription);

module.exports = router;
