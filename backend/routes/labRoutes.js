/**
 * Lab Test Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getLabTests,
  getLabTest,
  createLabTest,
  updateLabTest,
  deleteLabTest,
  getLabOrders,
  getLabOrder,
  createLabOrder,
  collectSample,
  addResult,
  getPatientLabHistory,
  getLabStats,
  getCategories
} = require('../controllers/labController');

// All routes require authentication
router.use(protect);

// Lab stats - Admin, Lab
router.get('/stats', authorize(ROLES.ADMIN, ROLES.LAB), getLabStats);

// Get categories
router.get('/categories', getCategories);

// ===== Lab Test Master Routes =====
router.get('/tests', getLabTests);
router.get('/tests/:id', getLabTest);
router.post('/tests', authorize(ROLES.ADMIN, ROLES.LAB), createLabTest);
router.put('/tests/:id', authorize(ROLES.ADMIN, ROLES.LAB), updateLabTest);
router.delete('/tests/:id', authorize(ROLES.ADMIN), deleteLabTest);

// ===== Lab Order Routes =====
router.get('/orders', getLabOrders);
router.get('/orders/:id', getLabOrder);
router.post('/orders', authorize(ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB), createLabOrder);
router.put('/orders/:id/collect', authorize(ROLES.LAB, ROLES.NURSE), collectSample);
router.put('/orders/:id/result', authorize(ROLES.LAB), addResult);

// Patient lab history
router.get('/patient/:patientId', getPatientLabHistory);

module.exports = router;
