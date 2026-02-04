/**
 * Bed Controller
 * Handles bed and ward management
 */

const Bed = require('../models/Bed');
const asyncHandler = require('../middleware/asyncHandler');
const { BED_STATUS } = require('../config/constants');

/**
 * @desc    Get all beds
 * @route   GET /api/beds
 * @access  Private
 */
exports.getBeds = asyncHandler(async (req, res, next) => {
  const { ward, wardType, status, floor, page = 1, limit = 20 } = req.query;

  let query = {};

  if (ward) query.ward = ward;
  if (wardType) query.wardType = wardType;
  if (status) query.status = status;
  if (floor) query.floor = parseInt(floor);

  const beds = await Bed.find(query)
    .populate({
      path: 'currentPatient',
      populate: { path: 'userId', select: 'name' }
    })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ ward: 1, bedNumber: 1 });

  const total = await Bed.countDocuments(query);

  res.status(200).json({
    success: true,
    count: beds.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: beds
  });
});

/**
 * @desc    Get single bed
 * @route   GET /api/beds/:id
 * @access  Private
 */
exports.getBed = asyncHandler(async (req, res, next) => {
  const bed = await Bed.findById(req.params.id)
    .populate({
      path: 'currentPatient',
      populate: { path: 'userId', select: 'name email phone' }
    });

  if (!bed) {
    return res.status(404).json({
      success: false,
      message: 'Bed not found'
    });
  }

  res.status(200).json({
    success: true,
    data: bed
  });
});

/**
 * @desc    Create bed
 * @route   POST /api/beds
 * @access  Private (Admin)
 */
exports.createBed = asyncHandler(async (req, res, next) => {
  const bed = await Bed.create(req.body);

  res.status(201).json({
    success: true,
    data: bed
  });
});

/**
 * @desc    Update bed
 * @route   PUT /api/beds/:id
 * @access  Private (Admin)
 */
exports.updateBed = asyncHandler(async (req, res, next) => {
  let bed = await Bed.findById(req.params.id);

  if (!bed) {
    return res.status(404).json({
      success: false,
      message: 'Bed not found'
    });
  }

  bed = await Bed.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: bed
  });
});

/**
 * @desc    Delete bed
 * @route   DELETE /api/beds/:id
 * @access  Private (Admin)
 */
exports.deleteBed = asyncHandler(async (req, res, next) => {
  const bed = await Bed.findById(req.params.id);

  if (!bed) {
    return res.status(404).json({
      success: false,
      message: 'Bed not found'
    });
  }

  if (bed.status === BED_STATUS.OCCUPIED) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete an occupied bed'
    });
  }

  await bed.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Bed deleted successfully'
  });
});

/**
 * @desc    Get available beds
 * @route   GET /api/beds/available
 * @access  Private
 */
exports.getAvailableBeds = asyncHandler(async (req, res, next) => {
  const { wardType } = req.query;

  let query = { status: BED_STATUS.AVAILABLE };
  if (wardType) query.wardType = wardType;

  const beds = await Bed.find(query).sort({ ward: 1, bedNumber: 1 });

  res.status(200).json({
    success: true,
    count: beds.length,
    data: beds
  });
});

/**
 * @desc    Get bed statistics
 * @route   GET /api/beds/stats
 * @access  Private (Admin)
 */
exports.getBedStats = asyncHandler(async (req, res, next) => {
  const total = await Bed.countDocuments();
  const available = await Bed.countDocuments({ status: BED_STATUS.AVAILABLE });
  const occupied = await Bed.countDocuments({ status: BED_STATUS.OCCUPIED });
  const maintenance = await Bed.countDocuments({ status: BED_STATUS.MAINTENANCE });

  // Get stats by ward type
  const byWardType = await Bed.aggregate([
    {
      $group: {
        _id: '$wardType',
        total: { $sum: 1 },
        available: {
          $sum: { $cond: [{ $eq: ['$status', BED_STATUS.AVAILABLE] }, 1, 0] }
        },
        occupied: {
          $sum: { $cond: [{ $eq: ['$status', BED_STATUS.OCCUPIED] }, 1, 0] }
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      total,
      available,
      occupied,
      maintenance,
      occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(2) : 0,
      byWardType
    }
  });
});

/**
 * @desc    Get wards list
 * @route   GET /api/beds/wards
 * @access  Private
 */
exports.getWards = asyncHandler(async (req, res, next) => {
  const wards = await Bed.distinct('ward');

  res.status(200).json({
    success: true,
    data: wards
  });
});

/**
 * @desc    Mark bed for maintenance
 * @route   PUT /api/beds/:id/maintenance
 * @access  Private (Admin)
 */
exports.markMaintenance = asyncHandler(async (req, res, next) => {
  let bed = await Bed.findById(req.params.id);

  if (!bed) {
    return res.status(404).json({
      success: false,
      message: 'Bed not found'
    });
  }

  if (bed.status === BED_STATUS.OCCUPIED) {
    return res.status(400).json({
      success: false,
      message: 'Cannot mark occupied bed for maintenance'
    });
  }

  bed.status = BED_STATUS.MAINTENANCE;
  bed.notes = req.body.notes || 'Under maintenance';
  await bed.save();

  res.status(200).json({
    success: true,
    data: bed
  });
});
