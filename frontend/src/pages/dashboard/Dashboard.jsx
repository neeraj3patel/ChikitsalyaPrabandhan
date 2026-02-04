/**
 * Dashboard Page
 * Role-based dashboard display
 */

import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import DoctorDashboard from './DoctorDashboard';
import PatientDashboard from './PatientDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Render role-specific dashboard
  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'DOCTOR':
      return <DoctorDashboard />;
    case 'PATIENT':
      return <PatientDashboard />;
    default:
      return <PatientDashboard />;
  }
};

export default Dashboard;
