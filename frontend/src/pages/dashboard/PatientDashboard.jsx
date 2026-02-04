/**
 * Patient Dashboard
 * Overview for patient users
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
  FiFileText,
  FiDollarSign,
  FiClock,
  FiPlus
} from 'react-icons/fi';

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getPatientDashboard();
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

  const { patient, stats, upcomingAppointments, recentVisits, pendingBills } = data || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome, {patient?.userId?.name}</h1>
          <p className="text-slate-500">Patient ID: {patient?.patientId}</p>
        </div>
        <Link to="/appointments/new">
          <Button icon={FiPlus}>Book Appointment</Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Upcoming Appointments"
          value={stats?.upcomingAppointmentsCount || 0}
          icon={FiCalendar}
          color="blue"
        />
        <StatCard
          title="Total Visits"
          value={stats?.totalVisits || 0}
          icon={FiClock}
          color="green"
        />
        <StatCard
          title="Medical Records"
          value={stats?.medicalRecords || 0}
          icon={FiFileText}
          color="purple"
        />
        <StatCard
          title="Pending Bills"
          value={`₹${(stats?.totalDue || 0).toLocaleString()}`}
          subtitle={`${stats?.pendingBillsCount || 0} invoices`}
          icon={FiDollarSign}
          color="red"
        />
      </div>

      {/* Patient Info Card */}
      <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Blood Group</p>
            <p className="text-xl font-bold">{patient?.bloodGroup || 'N/A'}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Age</p>
            <p className="text-xl font-bold">{patient?.age || 'N/A'} years</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Gender</p>
            <p className="text-xl font-bold">{patient?.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Allergies</p>
            <p className="text-xl font-bold">
              {patient?.allergies?.length || 0} known
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h2>
            <Link to="/appointments" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingAppointments?.length > 0 ? (
              upcomingAppointments.map((apt) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center bg-blue-100 rounded-lg p-2 min-w-12.5">
                      <p className="text-xs font-medium text-blue-600">
                        {new Date(apt.date).toLocaleDateString('en-US', { month: 'short' })}
                      </p>
                      <p className="text-xl font-bold text-blue-700">
                        {new Date(apt.date).getDate()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">
                        Dr. {apt.doctorId?.userId?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500">{apt.time}</p>
                    </div>
                  </div>
                  <Badge variant="info">{apt.type}</Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FiCalendar className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500">No upcoming appointments</p>
                <Link to="/appointments/new">
                  <Button variant="outline" className="mt-4" size="sm">
                    Book Now
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Visits */}
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Recent Visits</h2>
            <Link to="/records" className="text-sm text-blue-600 hover:underline">
              View Records
            </Link>
          </div>
          <div className="space-y-3">
            {recentVisits?.length > 0 ? (
              recentVisits.map((visit) => (
                <div
                  key={visit._id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      Dr. {visit.doctorId?.userId?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(visit.date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="success">Completed</Badge>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-center py-4">No recent visits</p>
            )}
          </div>
        </div>
      </div>

      {/* Pending Bills */}
      {pendingBills?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">Pending Bills</h2>
            <Link to="/billing" className="text-sm text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Invoice
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Balance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pendingBills.map((bill) => (
                  <tr key={bill._id}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {bill.invoiceId}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(bill.invoiceDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      ₹{bill.totalAmount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-red-600">
                      ₹{bill.balanceAmount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={bill.paymentStatus === 'PARTIAL' ? 'warning' : 'danger'}
                      >
                        {bill.paymentStatus}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
