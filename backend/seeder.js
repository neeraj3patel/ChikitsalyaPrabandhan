/**
 * Database Seeder
 * Seeds the database with initial data for testing
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config();

// Load models
const User = require('./models/User');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Bed = require('./models/Bed');
const { LabTest } = require('./models/LabTest');
const Pharmacy = require('./models/Pharmacy');

const { ROLES } = require('./config/constants');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

// Default password from environment variable
const DEFAULT_PASSWORD = process.env.SEEDER_DEFAULT_PASSWORD || 'password123';

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Patient.deleteMany();
    await Doctor.deleteMany();
    await Bed.deleteMany();
    await LabTest.deleteMany();
    await Pharmacy.deleteMany();
    
    // Clear additional collections
    const mongoose = require('mongoose');
    await mongoose.connection.collection('appointments').deleteMany({});
    await mongoose.connection.collection('opdrecords').deleteMany({});
    await mongoose.connection.collection('ipdrecords').deleteMany({});
    await mongoose.connection.collection('billings').deleteMany({});

    console.log('Data cleared...');

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.ADMIN,
      phone: '9876543210',
      isActive: true
    });
    console.log('Admin user created');

    // Create Doctor Users
    const doctorUser1 = await User.create({
      name: 'Dr. John Smith',
      email: 'doctor@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.DOCTOR,
      phone: '9876543211',
      isActive: true
    });

    const doctorUser2 = await User.create({
      name: 'Dr. Sarah Johnson',
      email: 'sarah@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.DOCTOR,
      phone: '9876543212',
      isActive: true
    });

    // Create Doctor Profiles
    await Doctor.create({
      userId: doctorUser1._id,
      specialization: 'Cardiology',
      department: 'Cardiology',
      consultationFee: 500,
      licenseNumber: 'MED123456',
      experience: 10,
      qualification: [
        { degree: 'MBBS', institution: 'AIIMS Delhi', year: 2010 },
        { degree: 'MD', institution: 'AIIMS Delhi', year: 2014 }
      ],
      availability: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
        { day: 'Tuesday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
        { day: 'Thursday', startTime: '09:00', endTime: '17:00', maxPatients: 20 },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', maxPatients: 20 }
      ]
    });

    await Doctor.create({
      userId: doctorUser2._id,
      specialization: 'Orthopedics',
      department: 'Orthopedics',
      consultationFee: 600,
      licenseNumber: 'MED123457',
      experience: 8,
      qualification: [
        { degree: 'MBBS', institution: 'JIPMER', year: 2012 },
        { degree: 'MS', institution: 'JIPMER', year: 2016 }
      ],
      availability: [
        { day: 'Monday', startTime: '10:00', endTime: '18:00', maxPatients: 15 },
        { day: 'Wednesday', startTime: '10:00', endTime: '18:00', maxPatients: 15 },
        { day: 'Friday', startTime: '10:00', endTime: '18:00', maxPatients: 15 }
      ]
    });
    console.log('Doctor users created');

    // Create Patient Users
    const patientUser1 = await User.create({
      name: 'John Doe',
      email: 'patient@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.PATIENT,
      phone: '9876543213',
      address: {
        street: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        zipCode: '400001'
      },
      isActive: true
    });

    const patientUser2 = await User.create({
      name: 'Jane Doe',
      email: 'jane@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.PATIENT,
      phone: '9876543214',
      isActive: true
    });

    // Create Patient Profiles
    await Patient.create({
      userId: patientUser1._id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'Male',
      bloodGroup: 'O+',
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '9876543214'
      },
      allergies: ['Penicillin'],
      medicalHistory: [
        { condition: 'Hypertension', diagnosedDate: new Date('2020-01-01'), notes: 'Controlled with medication' }
      ]
    });

    await Patient.create({
      userId: patientUser2._id,
      dateOfBirth: new Date('1992-08-20'),
      gender: 'Female',
      bloodGroup: 'A+',
      emergencyContact: {
        name: 'John Doe',
        relationship: 'Spouse',
        phone: '9876543213'
      }
    });
    console.log('Patient users created');

    // Create other staff
    await User.create({
      name: 'Nurse Nancy',
      email: 'nurse@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.NURSE,
      phone: '9876543215',
      isActive: true
    });

    await User.create({
      name: 'Reception Rita',
      email: 'reception@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.RECEPTIONIST,
      phone: '9876543216',
      isActive: true
    });

    await User.create({
      name: 'Lab Larry',
      email: 'lab@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.LAB,
      phone: '9876543217',
      isActive: true
    });

    await User.create({
      name: 'Pharma Phil',
      email: 'pharmacy@hospital.com',
      password: DEFAULT_PASSWORD,
      role: ROLES.PHARMACY,
      phone: '9876543218',
      isActive: true
    });
    console.log('Staff users created');

    // Create Beds
    const wards = [
      { name: 'General Ward A', type: 'General', floor: 1, rate: 1000 },
      { name: 'General Ward B', type: 'General', floor: 1, rate: 1000 },
      { name: 'Private Ward', type: 'Private', floor: 2, rate: 3000 },
      { name: 'ICU', type: 'ICU', floor: 3, rate: 10000 },
      { name: 'Emergency', type: 'Emergency', floor: 0, rate: 5000 }
    ];

    for (const ward of wards) {
      for (let i = 1; i <= 5; i++) {
        await Bed.create({
          bedNumber: `${ward.name.substring(0, 3).toUpperCase()}-${i}`,
          ward: ward.name,
          wardType: ward.type,
          floor: ward.floor,
          dailyRate: ward.rate,
          facilities: ward.type === 'ICU' ? ['Ventilator', 'Monitor', 'Oxygen'] : ['TV', 'AC']
        });
      }
    }
    console.log('Beds created');

    // Create Lab Tests
    const labTests = [
      { testName: 'Complete Blood Count', category: 'Blood', price: 500, normalRange: 'Varies', turnaroundTime: '4 hours' },
      { testName: 'Blood Sugar Fasting', category: 'Blood', price: 200, normalRange: '70-100 mg/dL', turnaroundTime: '2 hours' },
      { testName: 'Lipid Profile', category: 'Blood', price: 800, normalRange: 'Varies', turnaroundTime: '6 hours' },
      { testName: 'Liver Function Test', category: 'Blood', price: 1000, normalRange: 'Varies', turnaroundTime: '6 hours' },
      { testName: 'Kidney Function Test', category: 'Blood', price: 900, normalRange: 'Varies', turnaroundTime: '6 hours' },
      { testName: 'Urinalysis', category: 'Urine', price: 300, normalRange: 'Varies', turnaroundTime: '4 hours' },
      { testName: 'X-Ray Chest', category: 'Imaging', price: 500, normalRange: 'N/A', turnaroundTime: '1 hour' },
      { testName: 'ECG', category: 'Cardiac', price: 400, normalRange: 'N/A', turnaroundTime: '30 minutes' },
      { testName: 'MRI Brain', category: 'Imaging', price: 8000, normalRange: 'N/A', turnaroundTime: '24 hours' },
      { testName: 'CT Scan', category: 'Imaging', price: 5000, normalRange: 'N/A', turnaroundTime: '12 hours' }
    ];

    for (const test of labTests) {
      await LabTest.create(test);
    }
    console.log('Lab tests created');

    // Create Medicines
    const medicines = [
      { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', category: 'Tablet', manufacturer: 'Cipla', batchNumber: 'BAT001', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), stock: 1000, purchasePrice: 1, sellingPrice: 2, prescriptionRequired: false },
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', category: 'Capsule', manufacturer: 'Sun Pharma', batchNumber: 'BAT002', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), stock: 500, purchasePrice: 5, sellingPrice: 10, prescriptionRequired: true },
      { name: 'Omeprazole 20mg', genericName: 'Omeprazole', category: 'Capsule', manufacturer: 'Dr. Reddy', batchNumber: 'BAT003', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), stock: 800, purchasePrice: 3, sellingPrice: 6, prescriptionRequired: true },
      { name: 'Metformin 500mg', genericName: 'Metformin', category: 'Tablet', manufacturer: 'Cipla', batchNumber: 'BAT004', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), stock: 600, purchasePrice: 2, sellingPrice: 4, prescriptionRequired: true },
      { name: 'Amlodipine 5mg', genericName: 'Amlodipine', category: 'Tablet', manufacturer: 'Sun Pharma', batchNumber: 'BAT005', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), stock: 400, purchasePrice: 4, sellingPrice: 8, prescriptionRequired: true },
      { name: 'Cough Syrup', genericName: 'Dextromethorphan', category: 'Syrup', manufacturer: 'Abbott', batchNumber: 'BAT006', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2025-06-01'), stock: 200, purchasePrice: 50, sellingPrice: 80, prescriptionRequired: false },
      { name: 'Insulin Injection', genericName: 'Insulin', category: 'Injection', manufacturer: 'Novo Nordisk', batchNumber: 'BAT007', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2025-01-01'), stock: 50, purchasePrice: 200, sellingPrice: 350, prescriptionRequired: true },
      { name: 'Betadine Cream', genericName: 'Povidone Iodine', category: 'Cream', manufacturer: 'Win Medicare', batchNumber: 'BAT008', manufacturingDate: new Date('2024-01-01'), expiryDate: new Date('2026-01-01'), stock: 300, purchasePrice: 30, sellingPrice: 50, prescriptionRequired: false }
    ];

    for (const medicine of medicines) {
      await Pharmacy.create(medicine);
    }
    console.log('Medicines created');

    console.log('\n===== SEED COMPLETE =====');
    console.log('\nTest Accounts Created (all use password from SEEDER_DEFAULT_PASSWORD env var):');
    console.log('Admin: admin@hospital.com');
    console.log('Doctor: doctor@hospital.com, sarah@hospital.com');
    console.log('Patient: patient@hospital.com, jane@hospital.com');
    console.log('Nurse: nurse@hospital.com');
    console.log('Receptionist: reception@hospital.com');
    console.log('Lab: lab@hospital.com');
    console.log('Pharmacy: pharmacy@hospital.com');
    console.log('\nDefault password: ' + DEFAULT_PASSWORD);

    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

// Run seeder
seedData();
