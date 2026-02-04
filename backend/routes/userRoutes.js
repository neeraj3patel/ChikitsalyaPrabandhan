/**
 * User Management Routes
 */

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  getUserStats
} = require('../controllers/userController');

// All routes require authentication and admin role
router.use(protect);
router.use(authorize(ROLES.ADMIN));

// Get user stats
router.get('/stats', getUserStats);

// CRUD routes
router.get('/', getUsers);
router.get('/:id', getUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

// Activate user
router.put('/:id/activate', activateUser);

module.exports = router;
