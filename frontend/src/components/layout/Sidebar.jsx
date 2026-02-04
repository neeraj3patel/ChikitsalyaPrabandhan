/**
 * Sidebar Component
 * Navigation sidebar with role-based menu items
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiFileText,
  FiActivity,
  FiPackage,
  FiClipboard,
  FiDollarSign,
  FiSettings,
  FiLogOut,
  FiGrid
} from 'react-icons/fi';

const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Menu items based on role
  const getMenuItems = () => {
    const baseItems = [
      { path: '/dashboard', icon: FiHome, label: 'Dashboard' }
    ];

    const adminItems = [
      { path: '/patients', icon: FiUsers, label: 'Patients' },
      { path: '/doctors', icon: FiUserPlus, label: 'Doctors' },
      { path: '/appointments', icon: FiCalendar, label: 'Appointments' },
      { path: '/opd', icon: FiFileText, label: 'OPD Records' },
      { path: '/ipd', icon: FiActivity, label: 'IPD Records' },
      { path: '/beds', icon: FiGrid, label: 'Beds & Wards' },
      { path: '/pharmacy', icon: FiPackage, label: 'Pharmacy' },
      { path: '/lab', icon: FiClipboard, label: 'Lab Tests' },
      { path: '/billing', icon: FiDollarSign, label: 'Billing' }
    ];

    const doctorItems = [
      { path: '/patients', icon: FiUsers, label: 'Patients' },
      { path: '/appointments', icon: FiCalendar, label: 'Appointments' },
      { path: '/opd', icon: FiFileText, label: 'OPD Records' },
      { path: '/ipd', icon: FiActivity, label: 'IPD Records' },
      { path: '/lab', icon: FiClipboard, label: 'Lab Tests' }
    ];

    const patientItems = [
      { path: '/appointments', icon: FiCalendar, label: 'My Appointments' },
      { path: '/billing', icon: FiDollarSign, label: 'My Bills' }
    ];

    const nurseItems = [
      { path: '/patients', icon: FiUsers, label: 'Patients' },
      { path: '/ipd', icon: FiActivity, label: 'IPD Records' },
      { path: '/beds', icon: FiGrid, label: 'Beds & Wards' }
    ];

    const receptionistItems = [
      { path: '/patients', icon: FiUsers, label: 'Patients' },
      { path: '/appointments', icon: FiCalendar, label: 'Appointments' },
      { path: '/billing', icon: FiDollarSign, label: 'Billing' }
    ];

    const labItems = [
      { path: '/lab', icon: FiClipboard, label: 'Lab Tests' }
    ];

    const pharmacyItems = [
      { path: '/pharmacy', icon: FiPackage, label: 'Pharmacy' }
    ];

    switch (user?.role) {
      case 'ADMIN':
        return [...baseItems, ...adminItems];
      case 'DOCTOR':
        return [...baseItems, ...doctorItems];
      case 'PATIENT':
        return [...baseItems, ...patientItems];
      case 'NURSE':
        return [...baseItems, ...nurseItems];
      case 'RECEPTIONIST':
        return [...baseItems, ...receptionistItems];
      case 'LAB':
        return [...baseItems, ...labItems];
      case 'PHARMACY':
        return [...baseItems, ...pharmacyItems];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-slate-800 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <img src="/hostpitalImg.webp" alt="Hospital Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold">HMS</h1>
            <p className="text-xs text-slate-400">Hospital Management System</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-sm">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
