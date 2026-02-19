/**
 * API Service
 * Axios instance and API configuration
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
  logout: () => api.get('/auth/logout')
};

// Dashboard API
export const dashboardAPI = {
  getAdminDashboard: () => api.get('/dashboard/admin'),
  getDoctorDashboard: () => api.get('/dashboard/doctor'),
  getPatientDashboard: () => api.get('/dashboard/patient')
};

// Patients API
export const patientsAPI = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (id) => api.get(`/patients/${id}`),
  getByUserId: (userId) => api.get(`/patients/user/${userId}`),
  create: (data) => api.post('/patients', data),
  update: (id, data) => api.put(`/patients/${id}`, data),
  delete: (id) => api.delete(`/patients/${id}`),
  addMedicalHistory: (id, data) => api.post(`/patients/${id}/medical-history`, data),
  addAllergy: (id, data) => api.post(`/patients/${id}/allergies`, data)
};

// Doctors API
export const doctorsAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getByUserId: (userId) => api.get(`/doctors/user/${userId}`),
  create: (data) => api.post('/doctors', data),
  update: (id, data) => api.put(`/doctors/${id}`, data),
  delete: (id) => api.delete(`/doctors/${id}`),
  getSlots: (id, date) => api.get(`/doctors/${id}/slots`, { params: { date } }),
  getSpecializations: () => api.get('/doctors/specializations'),
  getDepartments: () => api.get('/doctors/departments')
};

// Appointments API
export const appointmentsAPI = {
  getAll: (params) => api.get('/appointments', { params }),
  getById: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments', data),
  update: (id, data) => api.put(`/appointments/${id}`, data),
  updateStatus: (id, data) => api.put(`/appointments/${id}`, data),
  delete: (id) => api.delete(`/appointments/${id}`),
  cancel: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  complete: (id) => api.put(`/appointments/${id}/complete`),
  getToday: () => api.get('/appointments/today'),
  getStats: () => api.get('/appointments/stats')
};

// OPD API
export const opdAPI = {
  getAll: (params) => api.get('/opd', { params }),
  getById: (id) => api.get(`/opd/${id}`),
  create: (data) => api.post('/opd', data),
  update: (id, data) => api.put(`/opd/${id}`, data),
  delete: (id) => api.delete(`/opd/${id}`),
  getPatientHistory: (patientId) => api.get(`/opd/patient/${patientId}`)
};

// IPD API
export const ipdAPI = {
  getAll: (params) => api.get('/ipd', { params }),
  getById: (id) => api.get(`/ipd/${id}`),
  admit: (data) => api.post('/ipd/admit', data),
  discharge: (id, data) => api.put(`/ipd/${id}/discharge`, data),
  addNote: (id, data) => api.post(`/ipd/${id}/notes`, data),
  addVitals: (id, data) => api.post(`/ipd/${id}/vitals`, data),
  addMedication: (id, data) => api.post(`/ipd/${id}/medication`, data),
  transfer: (id, data) => api.put(`/ipd/${id}/transfer`, data),
  getStats: () => api.get('/ipd/stats')
};

// Beds API
export const bedsAPI = {
  getAll: (params) => api.get('/beds', { params }),
  getById: (id) => api.get(`/beds/${id}`),
  create: (data) => api.post('/beds', data),
  update: (id, data) => api.put(`/beds/${id}`, data),
  delete: (id) => api.delete(`/beds/${id}`),
  getAvailable: (params) => api.get('/beds/available', { params }),
  getStats: () => api.get('/beds/stats'),
  getWards: () => api.get('/beds/wards')
};

// Pharmacy API
export const pharmacyAPI = {
  getAll: (params) => api.get('/pharmacy', { params }),
  getById: (id) => api.get(`/pharmacy/${id}`),
  create: (data) => api.post('/pharmacy', data),
  update: (id, data) => api.put(`/pharmacy/${id}`, data),
  delete: (id) => api.delete(`/pharmacy/${id}`),
  updateStock: (id, data) => api.put(`/pharmacy/${id}/stock`, data),
  getLowStock: () => api.get('/pharmacy/low-stock'),
  getExpired: () => api.get('/pharmacy/expired'),
  getExpiringSoon: () => api.get('/pharmacy/expiring-soon'),
  getStats: () => api.get('/pharmacy/stats'),
  getCategories: () => api.get('/pharmacy/categories')
};

// Lab API
export const labAPI = {
  // Tests
  getAll: (params) => api.get('/lab/tests', { params }),
  getById: (id) => api.get(`/lab/tests/${id}`),
  create: (data) => api.post('/lab/tests', data),
  update: (id, data) => api.put(`/lab/tests/${id}`, data),
  delete: (id) => api.delete(`/lab/tests/${id}`),
  updateResult: (id, data) => api.put(`/lab/tests/${id}/result`, data),
  updateStatus: (id, data) => api.put(`/lab/tests/${id}/status`, data),
  // Orders
  getOrders: (params) => api.get('/lab/orders', { params }),
  getOrderById: (id) => api.get(`/lab/orders/${id}`),
  createOrder: (data) => api.post('/lab/orders', data),
  collectSample: (id) => api.put(`/lab/orders/${id}/collect`),
  addResult: (id, data) => api.put(`/lab/orders/${id}/result`, data),
  getPatientHistory: (patientId) => api.get(`/lab/patient/${patientId}`),
  getStats: () => api.get('/lab/stats'),
  getCategories: () => api.get('/lab/categories')
};

// Billing API
export const billingAPI = {
  getAll: (params) => api.get('/billing', { params }),
  getById: (id) => api.get(`/billing/${id}`),
  create: (data) => api.post('/billing', data),
  update: (id, data) => api.put(`/billing/${id}`, data),
  delete: (id) => api.delete(`/billing/${id}`),
  addPayment: (id, data) => api.post(`/billing/${id}/payment`, data),
  getPatientHistory: (patientId) => api.get(`/billing/patient/${patientId}`),
  getStats: () => api.get('/billing/stats'),
  getInvoice: (id) => api.get(`/billing/${id}/invoice`)
};

// Users API (Admin)
export const usersAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  activate: (id) => api.put(`/users/${id}/activate`),
  getStats: () => api.get('/users/stats')
};

export default api;
