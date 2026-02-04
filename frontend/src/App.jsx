/**
 * Hospital Management System - Main App Component
 * Handles routing and authentication
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoadingSpinner from './components/common/LoadingSpinner';

// Pages
import { 
  Login, 
  Register, 
  Dashboard,
  Patients,
  Doctors,
  Appointments,
  OPDRecords,
  IPDRecords,
  Beds,
  Pharmacy,
  Lab,
  Billing
} from './pages';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } 
      />

      {/* Protected Routes - Wrapped in DashboardLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Patients - Admin, Doctor, Nurse, Receptionist */}
        <Route 
          path="patients" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST']}>
              <Patients />
            </ProtectedRoute>
          } 
        />

        {/* Doctors - Admin */}
        <Route 
          path="doctors" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Doctors />
            </ProtectedRoute>
          } 
        />

        {/* Appointments - All roles */}
        <Route path="appointments" element={<Appointments />} />

        {/* OPD Records - Admin, Doctor, Nurse */}
        <Route 
          path="opd" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE']}>
              <OPDRecords />
            </ProtectedRoute>
          } 
        />

        {/* IPD Records - Admin, Doctor, Nurse */}
        <Route 
          path="ipd" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'DOCTOR', 'NURSE']}>
              <IPDRecords />
            </ProtectedRoute>
          } 
        />

        {/* Beds - Admin, Nurse */}
        <Route 
          path="beds" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'NURSE', 'RECEPTIONIST']}>
              <Beds />
            </ProtectedRoute>
          } 
        />

        {/* Pharmacy - Admin, Pharmacy */}
        <Route 
          path="pharmacy" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'PHARMACY']}>
              <Pharmacy />
            </ProtectedRoute>
          } 
        />

        {/* Lab - Admin, Lab, Doctor */}
        <Route 
          path="lab" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'LAB', 'DOCTOR']}>
              <Lab />
            </ProtectedRoute>
          } 
        />

        {/* Billing - Admin, Receptionist */}
        <Route 
          path="billing" 
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
              <Billing />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Catch all - redirect to login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </AuthProvider>
    </Router>
  );
};

export default App;
