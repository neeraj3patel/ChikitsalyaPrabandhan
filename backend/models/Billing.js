/**
 * Billing Model
 * Patient billing and invoice management
 */

const mongoose = require('mongoose');
const { PAYMENT_STATUS } = require('../config/constants');

const billingSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    unique: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  ipdRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'IPDRecord'
  },
  invoiceDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  services: [{
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['Consultation', 'Lab Test', 'Medicine', 'Room Charge', 'Surgery', 'Procedure', 'Other']
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      min: 0
    }
  }],
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    percentage: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    }
  },
  discount: {
    percentage: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      default: 0
    },
    reason: String
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      enum: ['Cash', 'Card', 'UPI', 'Insurance', 'Bank Transfer', 'Other'],
      required: true
    },
    transactionId: String,
    date: {
      type: Date,
      default: Date.now
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  }],
  insuranceClaim: {
    provider: String,
    policyNumber: String,
    claimAmount: Number,
    status: {
      type: String,
      enum: ['Not Applied', 'Pending', 'Approved', 'Rejected'],
      default: 'Not Applied'
    },
    approvedAmount: Number
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Generate Invoice ID before saving
billingSchema.pre('save', async function(next) {
  if (!this.invoiceId) {
    const count = await mongoose.model('Billing').countDocuments();
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.invoiceId = `INV${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  
  // Calculate service totals
  this.services.forEach(service => {
    service.total = (service.unitPrice * service.quantity) - service.discount;
  });
  
  // Calculate subtotal
  this.subtotal = this.services.reduce((sum, service) => sum + service.total, 0);
  
  // Calculate tax amount
  this.tax.amount = (this.subtotal * this.tax.percentage) / 100;
  
  // Calculate discount amount if percentage given
  if (this.discount.percentage > 0) {
    this.discount.amount = (this.subtotal * this.discount.percentage) / 100;
  }
  
  // Calculate total
  this.totalAmount = this.subtotal + this.tax.amount - this.discount.amount;
  
  // Calculate balance
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  // Update payment status
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = PAYMENT_STATUS.PAID;
  } else if (this.paidAmount > 0) {
    this.paymentStatus = PAYMENT_STATUS.PARTIAL;
  }
  
  next();
});

module.exports = mongoose.model('Billing', billingSchema);
