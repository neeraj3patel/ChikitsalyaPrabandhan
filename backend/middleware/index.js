/**
 * Middleware Index
 * Export all middleware from a single file
 */

const { protect, authorize } = require('./auth');
const errorHandler = require('./errorHandler');
const asyncHandler = require('./asyncHandler');
const { validate } = require('./validate');
const upload = require('./upload');

module.exports = {
  protect,
  authorize,
  errorHandler,
  asyncHandler,
  validate,
  upload
};
