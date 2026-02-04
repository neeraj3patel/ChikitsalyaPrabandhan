/**
 * Bed Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getBeds,
  getBed,
  createBed,
  updateBed,
  deleteBed,
  getAvailableBeds,
  getBedStats,
  getWards,
  markMaintenance
} = require('../controllers/bedController');

// All routes require authentication
router.use(protect);

// Get bed stats - Admin only
router.get('/stats', authorize(ROLES.ADMIN), getBedStats);

// Get available beds
router.get('/available', getAvailableBeds);

// Get wards list
router.get('/wards', getWards);

// Get all beds
router.get('/', getBeds);

// Get single bed
router.get('/:id', getBed);

// Admin only routes
router.post('/', authorize(ROLES.ADMIN), createBed);
router.put('/:id', authorize(ROLES.ADMIN), updateBed);
router.delete('/:id', authorize(ROLES.ADMIN), deleteBed);
router.put('/:id/maintenance', authorize(ROLES.ADMIN), markMaintenance);

module.exports = router;
