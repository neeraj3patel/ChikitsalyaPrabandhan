/**
 * Pharmacy/Medicine Model
 * Medicine inventory management
 */

const mongoose = require('mongoose');

const pharmacySchema = new mongoose.Schema({
  medicineId: {
    type: String,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please provide medicine name'],
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops', 'Inhaler', 'Other'],
    required: true
  },
  manufacturer: {
    type: String,
    required: true
  },
  batchNumber: {
    type: String,
    required: [true, 'Please provide batch number']
  },
  manufacturingDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: [true, 'Please provide expiry date']
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  minStockLevel: {
    type: Number,
    default: 10
  },
  unit: {
    type: String,
    enum: ['Strip', 'Bottle', 'Box', 'Vial', 'Tube', 'Piece'],
    default: 'Strip'
  },
  purchasePrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: [true, 'Please provide selling price'],
    min: 0
  },
  prescriptionRequired: {
    type: Boolean,
    default: true
  },
  description: String,
  sideEffects: [String],
  storage: String,
  supplier: {
    name: String,
    contact: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Generate Medicine ID before saving
pharmacySchema.pre('save', async function(next) {
  if (!this.medicineId) {
    const count = await mongoose.model('Pharmacy').countDocuments();
    this.medicineId = `MED${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Virtual for checking if stock is low
pharmacySchema.virtual('isLowStock').get(function() {
  return this.stock <= this.minStockLevel;
});

// Virtual for checking if expired
pharmacySchema.virtual('isExpired').get(function() {
  return new Date() > this.expiryDate;
});

// Index for search
pharmacySchema.index({ name: 'text', genericName: 'text' });

module.exports = mongoose.model('Pharmacy', pharmacySchema);
