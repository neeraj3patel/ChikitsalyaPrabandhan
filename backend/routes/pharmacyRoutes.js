/**
 * Pharmacy Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getLowStockMedicines,
  getExpiredMedicines,
  getExpiringSoon,
  getPharmacyStats,
  getCategories
} = require('../controllers/pharmacyController');

// All routes require authentication
router.use(protect);

// Get pharmacy stats - Admin, Pharmacy
router.get('/stats', authorize(ROLES.ADMIN, ROLES.PHARMACY), getPharmacyStats);

// Get low stock medicines - Admin, Pharmacy
router.get('/low-stock', authorize(ROLES.ADMIN, ROLES.PHARMACY), getLowStockMedicines);

// Get expired medicines - Admin, Pharmacy
router.get('/expired', authorize(ROLES.ADMIN, ROLES.PHARMACY), getExpiredMedicines);

// Get expiring soon medicines - Admin, Pharmacy
router.get('/expiring-soon', authorize(ROLES.ADMIN, ROLES.PHARMACY), getExpiringSoon);

// Get categories
router.get('/categories', getCategories);

// Get all medicines
router.get('/', getMedicines);

// Get single medicine
router.get('/:id', getMedicine);

// Admin/Pharmacy only routes
router.post('/', authorize(ROLES.ADMIN, ROLES.PHARMACY), createMedicine);
router.put('/:id', authorize(ROLES.ADMIN, ROLES.PHARMACY), updateMedicine);
router.delete('/:id', authorize(ROLES.ADMIN), deleteMedicine);
router.put('/:id/stock', authorize(ROLES.ADMIN, ROLES.PHARMACY), updateStock);

module.exports = router;
