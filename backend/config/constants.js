/**
 * Application Constants
 * Centralized configuration values
 */

module.exports = {
  // User Roles
  ROLES: {
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    RECEPTIONIST: 'RECEPTIONIST',
    PATIENT: 'PATIENT',
    LAB: 'LAB',
    PHARMACY: 'PHARMACY'
  },

  // Appointment Status
  APPOINTMENT_STATUS: {
    SCHEDULED: 'SCHEDULED',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW'
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID',
    REFUNDED: 'REFUNDED'
  },

  // Bed Status
  BED_STATUS: {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    MAINTENANCE: 'MAINTENANCE',
    RESERVED: 'RESERVED'
  },

  // IPD Status
  IPD_STATUS: {
    ADMITTED: 'ADMITTED',
    DISCHARGED: 'DISCHARGED',
    TRANSFERRED: 'TRANSFERRED'
  },

  // Blood Groups
  BLOOD_GROUPS: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],

  // Gender Options
  GENDERS: ['Male', 'Female', 'Other'],

  // Lab Test Status
  LAB_STATUS: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED'
  }
};
