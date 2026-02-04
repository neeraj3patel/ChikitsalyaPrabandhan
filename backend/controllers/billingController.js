/**
 * Billing Controller
 * Handles billing and invoice management
 */

const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const asyncHandler = require('../middleware/asyncHandler');
const { ROLES, PAYMENT_STATUS } = require('../config/constants');

/**
 * @desc    Get all bills
 * @route   GET /api/billing
 * @access  Private
 */
exports.getBills = asyncHandler(async (req, res, next) => {
  const { 
    patientId, 
    paymentStatus, 
    startDate, 
    endDate,
    page = 1, 
    limit = 20 
  } = req.query;

  let query = {};

  if (patientId) query.patientId = patientId;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (startDate && endDate) {
    query.invoiceDate = { $gte: new Date(startDate), $lte: new Date(endDate) };
  }

  // Role-based filtering
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (patient) query.patientId = patient._id;
  }

  const bills = await Billing.find(query)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    })
    .populate('createdBy', 'name')
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .sort({ invoiceDate: -1 });

  const total = await Billing.countDocuments(query);

  res.status(200).json({
    success: true,
    count: bills.length,
    total,
    pages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    data: bills
  });
});

/**
 * @desc    Get single bill
 * @route   GET /api/billing/:id
 * @access  Private
 */
exports.getBill = asyncHandler(async (req, res, next) => {
  const bill = await Billing.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone address' }
    })
    .populate('createdBy', 'name')
    .populate('payments.receivedBy', 'name');

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }

  // Check authorization for patients
  if (req.user.role === ROLES.PATIENT) {
    const patient = await Patient.findOne({ userId: req.user.id });
    if (!patient || bill.patientId._id.toString() !== patient._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this bill'
      });
    }
  }

  res.status(200).json({
    success: true,
    data: bill
  });
});

/**
 * @desc    Create bill
 * @route   POST /api/billing
 * @access  Private (Admin, Receptionist)
 */
exports.createBill = asyncHandler(async (req, res, next) => {
  const { patientId, services, tax, discount, appointmentId, ipdRecordId, notes, dueDate } = req.body;

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({
      success: false,
      message: 'Patient not found'
    });
  }

  // Calculate totals
  let subtotal = 0;
  const processedServices = services.map(service => {
    const total = (service.unitPrice * (service.quantity || 1)) - (service.discount || 0);
    subtotal += total;
    return { ...service, total };
  });

  const taxAmount = tax?.percentage ? (subtotal * tax.percentage) / 100 : 0;
  const discountAmount = discount?.percentage ? (subtotal * discount.percentage) / 100 : (discount?.amount || 0);
  const totalAmount = subtotal + taxAmount - discountAmount;

  const bill = await Billing.create({
    patientId,
    services: processedServices,
    subtotal,
    tax: {
      percentage: tax?.percentage || 0,
      amount: taxAmount
    },
    discount: {
      percentage: discount?.percentage || 0,
      amount: discountAmount,
      reason: discount?.reason
    },
    totalAmount,
    balanceAmount: totalAmount,
    appointmentId,
    ipdRecordId,
    notes,
    dueDate,
    createdBy: req.user.id
  });

  const populatedBill = await Billing.findById(bill._id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone' }
    });

  res.status(201).json({
    success: true,
    data: populatedBill
  });
});

/**
 * @desc    Update bill
 * @route   PUT /api/billing/:id
 * @access  Private (Admin)
 */
exports.updateBill = asyncHandler(async (req, res, next) => {
  let bill = await Billing.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }

  // Don't allow updating paid bills
  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    return res.status(400).json({
      success: false,
      message: 'Cannot update a fully paid bill'
    });
  }

  bill = await Billing.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate({
    path: 'patientId',
    populate: { path: 'userId', select: 'name email phone' }
  });

  res.status(200).json({
    success: true,
    data: bill
  });
});

/**
 * @desc    Delete bill
 * @route   DELETE /api/billing/:id
 * @access  Private (Admin)
 */
exports.deleteBill = asyncHandler(async (req, res, next) => {
  const bill = await Billing.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }

  if (bill.paidAmount > 0) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete a bill with payments'
    });
  }

  await bill.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Bill deleted successfully'
  });
});

/**
 * @desc    Add payment to bill
 * @route   POST /api/billing/:id/payment
 * @access  Private (Admin, Receptionist)
 */
exports.addPayment = asyncHandler(async (req, res, next) => {
  const { amount, method, transactionId, notes } = req.body;

  let bill = await Billing.findById(req.params.id);

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }

  if (bill.paymentStatus === PAYMENT_STATUS.PAID) {
    return res.status(400).json({
      success: false,
      message: 'Bill is already fully paid'
    });
  }

  if (amount > bill.balanceAmount) {
    return res.status(400).json({
      success: false,
      message: `Amount exceeds balance. Maximum payable: ${bill.balanceAmount}`
    });
  }

  // Add payment
  bill.payments.push({
    amount,
    method,
    transactionId,
    notes,
    receivedBy: req.user.id
  });

  // Update paid amount and balance
  bill.paidAmount += amount;
  bill.balanceAmount = bill.totalAmount - bill.paidAmount;

  // Update payment status
  if (bill.balanceAmount <= 0) {
    bill.paymentStatus = PAYMENT_STATUS.PAID;
  } else {
    bill.paymentStatus = PAYMENT_STATUS.PARTIAL;
  }

  await bill.save();

  res.status(200).json({
    success: true,
    data: bill
  });
});

/**
 * @desc    Get patient's billing history
 * @route   GET /api/billing/patient/:patientId
 * @access  Private
 */
exports.getPatientBillingHistory = asyncHandler(async (req, res, next) => {
  const bills = await Billing.find({ patientId: req.params.patientId })
    .sort({ invoiceDate: -1 });

  const totalBilled = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const totalPaid = bills.reduce((sum, bill) => sum + bill.paidAmount, 0);
  const totalOutstanding = totalBilled - totalPaid;

  res.status(200).json({
    success: true,
    count: bills.length,
    summary: {
      totalBilled,
      totalPaid,
      totalOutstanding
    },
    data: bills
  });
});

/**
 * @desc    Get billing statistics
 * @route   GET /api/billing/stats
 * @access  Private (Admin)
 */
exports.getBillingStats = asyncHandler(async (req, res, next) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's stats
  const todayBills = await Billing.find({
    invoiceDate: { $gte: today, $lt: tomorrow }
  });

  const todayRevenue = todayBills.reduce((sum, bill) => sum + bill.paidAmount, 0);
  const todayBilled = todayBills.reduce((sum, bill) => sum + bill.totalAmount, 0);

  // Overall stats
  const pendingBills = await Billing.countDocuments({ 
    paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL] }
  });

  const totalOutstanding = await Billing.aggregate([
    { 
      $match: { 
        paymentStatus: { $in: [PAYMENT_STATUS.PENDING, PAYMENT_STATUS.PARTIAL] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$balanceAmount' }
      }
    }
  ]);

  // Monthly revenue
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthlyRevenue = await Billing.aggregate([
    {
      $match: {
        invoiceDate: { $gte: startOfMonth }
      }
    },
    {
      $group: {
        _id: null,
        billed: { $sum: '$totalAmount' },
        collected: { $sum: '$paidAmount' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      today: {
        bills: todayBills.length,
        billed: todayBilled,
        collected: todayRevenue
      },
      pendingBills,
      totalOutstanding: totalOutstanding[0]?.total || 0,
      monthlyRevenue: {
        billed: monthlyRevenue[0]?.billed || 0,
        collected: monthlyRevenue[0]?.collected || 0
      }
    }
  });
});

/**
 * @desc    Generate invoice PDF data
 * @route   GET /api/billing/:id/invoice
 * @access  Private
 */
exports.getInvoice = asyncHandler(async (req, res, next) => {
  const bill = await Billing.findById(req.params.id)
    .populate({
      path: 'patientId',
      populate: { path: 'userId', select: 'name email phone address' }
    })
    .populate('createdBy', 'name')
    .populate('payments.receivedBy', 'name');

  if (!bill) {
    return res.status(404).json({
      success: false,
      message: 'Bill not found'
    });
  }

  // Return invoice data for frontend to generate PDF
  res.status(200).json({
    success: true,
    data: {
      invoiceId: bill.invoiceId,
      invoiceDate: bill.invoiceDate,
      dueDate: bill.dueDate,
      patient: {
        name: bill.patientId.userId.name,
        email: bill.patientId.userId.email,
        phone: bill.patientId.userId.phone,
        address: bill.patientId.userId.address,
        patientId: bill.patientId.patientId
      },
      services: bill.services,
      subtotal: bill.subtotal,
      tax: bill.tax,
      discount: bill.discount,
      totalAmount: bill.totalAmount,
      paidAmount: bill.paidAmount,
      balanceAmount: bill.balanceAmount,
      paymentStatus: bill.paymentStatus,
      payments: bill.payments
    }
  });
});
