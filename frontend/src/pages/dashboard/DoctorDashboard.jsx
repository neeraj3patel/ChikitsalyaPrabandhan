/**
 * Doctor Dashboard
 * Overview for doctor users
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import {
  FiCalendar,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiActivity,
  FiFileText
} from 'react-icons/fi';

const DoctorDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDoctorDashboard();
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

  const { stats, todayAppointments, upcomingAppointments } = data || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Doctor Dashboard</h1>
        <p className="text-slate-500">Welcome back! Here's your schedule for today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Appointments"
          value={stats?.todayTotal || 0}
          icon={FiCalendar}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={stats?.completed || 0}
          icon={FiCheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={stats?.pending || 0}
          icon={FiClock}
          color="yellow"
        />
        <StatCard
          title="IPD Patients"
          value={stats?.ipdPatients || 0}
          icon={FiActivity}
          color="purple"
        />
      </div>

      {/* Total Patients */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Patients Treated</p>
            <p className="text-4xl font-bold mt-1">{stats?.totalPatients || 0}</p>
          </div>
          <FiUsers className="w-16 h-16 text-blue-400 opacity-50" />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Today's Appointments</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {todayAppointments?.length > 0 ? (
              todayAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
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
                        {apt.time} - {apt.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
                    {apt.status === 'SCHEDULED' && (
                      <Link to={`/opd/new?appointment=${apt._id}`}>
                        <Button size="sm" variant="outline">
                          <FiFileText className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No appointments for today</p>
            )}
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Appointments</h2>
          <div className="space-y-3">
            {upcomingAppointments?.length > 0 ? (
              upcomingAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-medium text-blue-600">
                        {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-slate-800">
                        {new Date(apt.date).getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        {apt.patientId?.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500">{apt.time}</p>
                    </div>
                  </div>
                  <Badge variant="info">{apt.type}</Badge>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No upcoming appointments</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
