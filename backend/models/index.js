/**
 * Models Index
 * Export all models from a single file
 */

const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const OPDRecord = require('./OPDRecord');
const IPDRecord = require('./IPDRecord');
const Bed = require('./Bed');
const Pharmacy = require('./Pharmacy');
const { LabTest, LabTestOrder } = require('./LabTest');
const Billing = require('./Billing');

module.exports = {
  User,
  Patient,
  Doctor,
  Appointment,
  OPDRecord,
  IPDRecord,
  Bed,
  Pharmacy,
  LabTest,
  LabTestOrder,
  Billing
};
