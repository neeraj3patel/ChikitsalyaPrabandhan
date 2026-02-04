/**
 * Routes Index
 * Export all routes from a single file
 */

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const patientRoutes = require('./patientRoutes');
const doctorRoutes = require('./doctorRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const opdRoutes = require('./opdRoutes');
const ipdRoutes = require('./ipdRoutes');
const bedRoutes = require('./bedRoutes');
const pharmacyRoutes = require('./pharmacyRoutes');
const labRoutes = require('./labRoutes');
const billingRoutes = require('./billingRoutes');
const dashboardRoutes = require('./dashboardRoutes');

module.exports = {
  authRoutes,
  userRoutes,
  patientRoutes,
  doctorRoutes,
  appointmentRoutes,
  opdRoutes,
  ipdRoutes,
  bedRoutes,
  pharmacyRoutes,
  labRoutes,
  billingRoutes,
  dashboardRoutes
};
