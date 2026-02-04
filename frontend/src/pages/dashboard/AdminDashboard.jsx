/**
 * Admin Dashboard
 * Overview for admin users
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import {
  FiUsers,
  FiUserPlus,
  FiCalendar,
  FiActivity,
  FiDollarSign,
  FiGrid,
  FiClock
} from 'react-icons/fi';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getAdminDashboard();
      setData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { stats, recentAppointments } = data || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Patients"
          value={stats?.totalPatients || 0}
          icon={FiUsers}
          color="blue"
        />
        <StatCard
          title="Total Doctors"
          value={stats?.totalDoctors || 0}
          icon={FiUserPlus}
          color="green"
        />
        <StatCard
          title="Today's Appointments"
          value={stats?.todayAppointments || 0}
          icon={FiCalendar}
          color="purple"
        />
        <StatCard
          title="Currently Admitted"
          value={stats?.currentlyAdmitted || 0}
          icon={FiActivity}
          color="yellow"
        />
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Bed Occupancy"
          value={`${stats?.bedOccupancy?.rate || 0}%`}
          subtitle={`${stats?.bedOccupancy?.occupied || 0} / ${stats?.bedOccupancy?.total || 0} beds`}
          icon={FiGrid}
          color="indigo"
        />
        <StatCard
          title="Today's Revenue"
          value={`₹${(stats?.todayRevenue || 0).toLocaleString()}`}
          icon={FiDollarSign}
          color="green"
        />
        <StatCard
          title="Pending Payments"
          value={`₹${(stats?.pendingPayments || 0).toLocaleString()}`}
          icon={FiClock}
          color="red"
        />
      </div>

      {/* Recent Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Appointments</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {recentAppointments?.length > 0 ? (
              recentAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {apt.patientId?.userId?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {apt.patientId?.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500">
                        Dr. {apt.doctorId?.userId?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        apt.status === 'COMPLETED'
                          ? 'success'
                          : apt.status === 'CANCELLED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {apt.status}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{apt.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No recent appointments</p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/patients"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FiUsers className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-slate-800">Manage Patients</p>
              <p className="text-sm text-slate-500">View & add patients</p>
            </Link>
            <Link
              to="/appointments"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FiCalendar className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-slate-800">Appointments</p>
              <p className="text-sm text-slate-500">Schedule & manage</p>
            </Link>
            <Link
              to="/billing"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FiDollarSign className="w-8 h-8 text-purple-600 mb-2" />
              <p className="font-medium text-slate-800">Billing</p>
              <p className="text-sm text-slate-500">Invoices & payments</p>
            </Link>
            <Link
              to="/beds"
              className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <FiGrid className="w-8 h-8 text-yellow-600 mb-2" />
              <p className="font-medium text-slate-800">Beds & Wards</p>
              <p className="text-sm text-slate-500">Manage capacity</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
