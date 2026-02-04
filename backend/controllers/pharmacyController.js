/**
 * Pharmacy Controller
 * Handles medicine inventory management
 */

const Pharmacy = require('../models/Pharmacy');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * @desc    Get all medicines
 * @route   GET /api/pharmacy
 * @access  Private
 */
exports.getMedicines = asyncHandler(async (req, res, next) => {
  const { 
    search, 
    category, 
    lowStock, 
    expired,
    page = 1, 
    limit = 20 
  } = req.query;

  let query = { isActive: true };

  if (category) query.category = category;
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { genericName: { $regex: search, $options: 'i' } },
      { medicineId: { $regex: search, $options: 'i' } }
    ];
  }

  if (lowStock === 'true') {
    query.$expr = { $lte: ['$stock', '$minStockLevel'] };
  }

  if (expired === 'true') {
    query.expiryDate = { $lt: new Date() };
  }

  const medicines = await Pharmacy.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ name: 1 });

  const total = await Pharmacy.countDocuments(query);

  res.status(200).json({
    success: true,
    count: medicines.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: medicines
  });
});

/**
 * @desc    Get single medicine
 * @route   GET /api/pharmacy/:id
 * @access  Private
 */
exports.getMedicine = asyncHandler(async (req, res, next) => {
  const medicine = await Pharmacy.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  res.status(200).json({
    success: true,
    data: medicine
  });
});

/**
 * @desc    Create medicine
 * @route   POST /api/pharmacy
 * @access  Private (Admin, Pharmacy)
 */
exports.createMedicine = asyncHandler(async (req, res, next) => {
  const medicine = await Pharmacy.create(req.body);

  res.status(201).json({
    success: true,
    data: medicine
  });
});

/**
 * @desc    Update medicine
 * @route   PUT /api/pharmacy/:id
 * @access  Private (Admin, Pharmacy)
 */
exports.updateMedicine = asyncHandler(async (req, res, next) => {
  let medicine = await Pharmacy.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  medicine = await Pharmacy.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: medicine
  });
});

/**
 * @desc    Delete medicine
 * @route   DELETE /api/pharmacy/:id
 * @access  Private (Admin)
 */
exports.deleteMedicine = asyncHandler(async (req, res, next) => {
  const medicine = await Pharmacy.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  // Soft delete
  medicine.isActive = false;
  await medicine.save();

  res.status(200).json({
    success: true,
    message: 'Medicine deleted successfully'
  });
});

/**
 * @desc    Update stock
 * @route   PUT /api/pharmacy/:id/stock
 * @access  Private (Admin, Pharmacy)
 */
exports.updateStock = asyncHandler(async (req, res, next) => {
  const { quantity, operation } = req.body;

  let medicine = await Pharmacy.findById(req.params.id);

  if (!medicine) {
    return res.status(404).json({
      success: false,
      message: 'Medicine not found'
    });
  }

  if (operation === 'add') {
    medicine.stock += quantity;
  } else if (operation === 'subtract') {
    if (medicine.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }
    medicine.stock -= quantity;
  } else {
    medicine.stock = quantity;
  }

  await medicine.save();

  res.status(200).json({
    success: true,
    data: medicine
  });
});

/**
 * @desc    Get low stock medicines
 * @route   GET /api/pharmacy/low-stock
 * @access  Private (Admin, Pharmacy)
 */
exports.getLowStockMedicines = asyncHandler(async (req, res, next) => {
  const medicines = await Pharmacy.find({
    isActive: true,
    $expr: { $lte: ['$stock', '$minStockLevel'] }
  }).sort({ stock: 1 });

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});

/**
 * @desc    Get expired medicines
 * @route   GET /api/pharmacy/expired
 * @access  Private (Admin, Pharmacy)
 */
exports.getExpiredMedicines = asyncHandler(async (req, res, next) => {
  const medicines = await Pharmacy.find({
    isActive: true,
    expiryDate: { $lt: new Date() }
  }).sort({ expiryDate: 1 });

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});

/**
 * @desc    Get medicines expiring soon (within 30 days)
 * @route   GET /api/pharmacy/expiring-soon
 * @access  Private (Admin, Pharmacy)
 */
exports.getExpiringSoon = asyncHandler(async (req, res, next) => {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const medicines = await Pharmacy.find({
    isActive: true,
    expiryDate: {
      $gte: new Date(),
      $lte: thirtyDaysFromNow
    }
  }).sort({ expiryDate: 1 });

  res.status(200).json({
    success: true,
    count: medicines.length,
    data: medicines
  });
});

/**
 * @desc    Get pharmacy statistics
 * @route   GET /api/pharmacy/stats
 * @access  Private (Admin, Pharmacy)
 */
exports.getPharmacyStats = asyncHandler(async (req, res, next) => {
  const totalMedicines = await Pharmacy.countDocuments({ isActive: true });
  
  const lowStock = await Pharmacy.countDocuments({
    isActive: true,
    $expr: { $lte: ['$stock', '$minStockLevel'] }
  });
  
  const expired = await Pharmacy.countDocuments({
    isActive: true,
    expiryDate: { $lt: new Date() }
  });

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  
  const expiringSoon = await Pharmacy.countDocuments({
    isActive: true,
    expiryDate: {
      $gte: new Date(),
      $lte: thirtyDaysFromNow
    }
  });

  const totalValue = await Pharmacy.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: null,
        total: { $sum: { $multiply: ['$stock', '$sellingPrice'] } }
      }
    }
  ]);

  const byCategory = await Pharmacy.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalStock: { $sum: '$stock' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalMedicines,
      lowStock,
      expired,
      expiringSoon,
      totalInventoryValue: totalValue[0]?.total || 0,
      byCategory
    }
  });
});

/**
 * @desc    Get medicine categories
 * @route   GET /api/pharmacy/categories
 * @access  Private
 */
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'];

  res.status(200).json({
    success: true,
    data: categories
  });
});
