/**
 * Lab Test Controller
 * Handles lab test management
 */

const { LabTest, LabTestOrder } = require('../models/LabTest');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES, LAB_STATUS } = require('../config/constants');

// ==================== LAB TEST CRUD ====================

/**
 * @desc    Get all lab tests (master list)
 * @route   GET /api/lab/tests
 * @access  Private
 */
exports.getLabTests = asyncHandler(async (req, res, next) => {
  const { category, search, page = 1, limit = 20 } = req.query;

  let query = { isActive: true };

  if (category) query.category = category;
  if (search) {
    query.$or = [
      { testName: { $regex: search, $options: 'i' } },
      { testCode: { $regex: search, $options: 'i' } }
    ];
  }

  const tests = await LabTest.find(query)
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ testName: 1 });

  const total = await LabTest.countDocuments(query);

  res.status(200).json({
    success: true,
    count: tests.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: tests
  });
});

/**
 * @desc    Get single lab test
 * @route   GET /api/lab/tests/:id
 * @access  Private
 */
exports.getLabTest = asyncHandler(async (req, res, next) => {
  const test = await LabTest.findById(req.params.id);

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  res.status(200).json({
    success: true,
    data: test
  });
});

/**
 * @desc    Create lab test
 * @route   POST /api/lab/tests
 * @access  Private (Admin, Lab)
 */
exports.createLabTest = asyncHandler(async (req, res, next) => {
  const test = await LabTest.create(req.body);

  res.status(201).json({
    success: true,
    data: test
  });
});

/**
 * @desc    Update lab test
 * @route   PUT /api/lab/tests/:id
 * @access  Private (Admin, Lab)
 */
exports.updateLabTest = asyncHandler(async (req, res, next) => {
  let test = await LabTest.findById(req.params.id);

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  test = await LabTest.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    data: test
  });
});

/**
 * @desc    Delete lab test
 * @route   DELETE /api/lab/tests/:id
 * @access  Private (Admin)
 */
exports.deleteLabTest = asyncHandler(async (req, res, next) => {
  const test = await LabTest.findById(req.params.id);

  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  // Soft delete
  test.isActive = false;
  await test.save();

  res.status(200).json({
    success: true,
    message: 'Lab test deleted successfully'
  });
});

// ==================== LAB TEST ORDERS ====================

/**
 * @desc    Get all lab test orders
 * @route   GET /api/lab/orders
 * @access  Private
 */
exports.getLabOrders = asyncHandler(async (req, res, next) => {
  const { status, patientId, priority, page = 1, limit = 20 } = req.query;

  let query = {};

  if (status) query.status = status;
  if (patientId) query.patientId = patientId;
  if (priority) query.priority = priority;

  // Role-based filtering
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (patient) query.patientId = patient._id;
  }

  const orders = await LabTestOrder.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('testId')
    .populate('sampleCollectedBy', 'name')
    .populate('completedBy', 'name')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ orderDate: -1 });

  const total = await LabTestOrder.countDocuments(query);

  res.status(200).json({
    success: true,
    count: orders.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: orders
  });
});

/**
 * @desc    Get single lab order
 * @route   GET /api/lab/orders/:id
 * @access  Private
 */
exports.getLabOrder = asyncHandler(async (req, res, next) => {
  const order = await LabTestOrder.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .populate('testId')
    .populate('sampleCollectedBy', 'name')
    .populate('completedBy', 'name');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Lab order not found'
    });
  }

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Create lab test order
 * @route   POST /api/lab/orders
 * @access  Private (Doctor, Admin, Lab)
 */
exports.createLabOrder = asyncHandler(async (req, res, next) => {
  const { patientId, testId, priority, notes, opdRecordId } = req.body;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Verify test exists
  const test = await LabTest.findById(testId);
  if (!test) {
    return res.status(404).json({
      success: false,
      message: 'Lab test not found'
    });
  }

  // Get doctor ID if doctor is creating
  let doctorId = req.body.doctorId;
  if (req.user.role === ROLES.DOCTOR) {
    const doctor = await Doctor.findOne({ userId: req.user.id });
    if (doctor) doctorId = doctor._id;
  }

  const order = await LabTestOrder.create({
    patientId,
    testId,
    doctorId,
    priority: priority || 'Normal',
    notes,
    opdRecordId
  });

  const populatedOrder = await LabTestOrder.findById(order._id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate('testId');

  res.status(201).json({
    success: true,
    data: populatedOrder
  });
});

/**
 * @desc    Collect sample
 * @route   PUT /api/lab/orders/:id/collect
 * @access  Private (Lab, Nurse)
 */
exports.collectSample = asyncHandler(async (req, res, next) => {
  let order = await LabTestOrder.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Lab order not found'
    });
  }

  order.sampleCollectedAt = new Date();
  order.sampleCollectedBy = req.user.id;
  order.status = LAB_STATUS.IN_PROGRESS;
  await order.save();

  res.status(200).json({
    success: true,
    data: order
  });
});

/**
 * @desc    Add test result
 * @route   PUT /api/lab/orders/:id/result
 * @access  Private (Lab)
 */
exports.addResult = asyncHandler(async (req, res, next) => {
  let order = await LabTestOrder.findById(req.params.id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Lab order not found'
    });
  }

  order.result = {
    value: req.body.value,
    unit: req.body.unit,
    isAbnormal: req.body.isAbnormal,
    notes: req.body.notes,
    attachments: req.body.attachments || []
  };
  order.status = LAB_STATUS.COMPLETED;
  order.completedAt = new Date();
  order.completedBy = req.user.id;
  await order.save();

  const populatedOrder = await LabTestOrder.findById(order._id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate('testId');

  res.status(200).json({
    success: true,
    data: populatedOrder
  });
});

/**
 * @desc    Get patient's lab history
 * @route   GET /api/lab/patient/:patientId
 * @access  Private
 */
exports.getPatientLabHistory = asyncHandler(async (req, res, next) => {
  const orders = await LabTestOrder.find({ patientId: req.params.patientId })
    .populate('testId')
    .populate({
      path: 'doctorId',
      populate: { path: 'userId', select: 'name' }
    })
    .sort({ orderDate: -1 });

  res.status(200).json({
    success: true,
    count: orders.length,
    data: orders
  });
});

/**
 * @desc    Get lab statistics
 * @route   GET /api/lab/stats
 * @access  Private (Admin, Lab)
 */
exports.getLabStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const totalTests = await LabTest.countDocuments({ isActive: true });
  
  const pendingOrders = await LabTestOrder.countDocuments({ status: LAB_STATUS.PENDING });
  const inProgressOrders = await LabTestOrder.countDocuments({ status: LAB_STATUS.IN_PROGRESS });
  
  const todayOrders = await LabTestOrder.countDocuments({
    orderDate: { $gte: today, $lt: tomorrow }
  });
  
  const todayCompleted = await LabTestOrder.countDocuments({
    completedAt: { $gte: today, $lt: tomorrow }
  });

  res.status(200).json({
    success: true,
    data: {
      totalTests,
      pendingOrders,
      inProgressOrders,
      todayOrders,
      todayCompleted
    }
  });
});

/**
 * @desc    Get test categories
 * @route   GET /api/lab/categories
 * @access  Private
 */
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await LabTest.distinct('category');

  res.status(200).json({
    success: true,
    data: categories
  });
});
