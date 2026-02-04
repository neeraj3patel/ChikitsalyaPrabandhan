/**
 * Billing Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getBills,
  getBill,
  createBill,
  updateBill,
  deleteBill,
  addPayment,
  getPatientBillingHistory,
  getBillingStats,
  getInvoice
} = require('../controllers/billingController');

// All routes require authentication
router.use(protect);

// Get billing stats - Admin only
router.get('/stats', authorize(ROLES.ADMIN), getBillingStats);

// Get patient billing history
router.get('/patient/:patientId', getPatientBillingHistory);

// Get all bills
router.get('/', getBills);

// Get single bill
router.get('/:id', getBill);

// Get invoice data
router.get('/:id/invoice', getInvoice);

// Create bill - Admin, Receptionist
router.post('/', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), createBill);

// Update bill - Admin
router.put('/:id', authorize(ROLES.ADMIN), updateBill);

// Delete bill - Admin
router.delete('/:id', authorize(ROLES.ADMIN), deleteBill);

// Add payment - Admin, Receptionist
router.post('/:id/payment', authorize(ROLES.ADMIN, ROLES.RECEPTIONIST), addPayment);

module.exports = router;
