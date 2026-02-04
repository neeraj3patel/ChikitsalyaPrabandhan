/**
 * Appointments Page
 * Appointment scheduling and management
 */

import { useState, useEffect } from 'react';
import { appointmentsAPI, doctorsAPI, patientsAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiCheck,
  FiX,
  FiCalendar
} from 'react-icons/fi';

const Appointments = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [currentPatientId, setCurrentPatientId] = useState(''); // For PATIENT role
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    date: '',
    time: '',
    type: 'Consultation',
    symptoms: '',
    notes: ''
  });

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
    fetchPatients();
  }, [pagination.page, searchTerm, statusFilter]);

  // For PATIENT role, auto-fill their own patient ID
  useEffect(() => {
    const fetchCurrentPatient = async () => {
      console.log('User object:', user);
      const userId = user?._id || user?.id;
      if (user?.role === 'PATIENT' && userId) {
        console.log('Fetching patient for user:', userId);
        try {
          const response = await patientsAPI.getByUserId(userId);
          console.log('Patient API response:', response.data);
          if (response.data.data) {
            const patientData = response.data.data;
            console.log('Setting patientId to:', patientData._id);
            setPatients([patientData]); // Set only current patient
            setCurrentPatientId(patientData._id); // Store for later use
            setFormData(prev => ({ ...prev, patientId: patientData._id }));
          }
        } catch (error) {
          console.log('Could not fetch current patient profile:', error);
        }
      }
    };
    fetchCurrentPatient();
  }, [user]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentsAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      setAppointments(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch appointments', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll({ limit: 100 });
      setDoctors(response.data.data);
    } catch (error) {
      console.error('Failed to fetch doctors');
    }
  };

  const fetchPatients = async () => {
    // Skip fetching all patients for PATIENT role - they can only see themselves
    if (user?.role === 'PATIENT') {
      return;
    }
    try {
      const response = await patientsAPI.getAll({ limit: 100 });
      console.log('Patients API response:', response.data);
      setPatients(response.data.data || []);
    } catch (error) {
      // User may not have permission to fetch all patients
      console.log('Could not fetch patients list:', error.response?.status, error.response?.data?.message);
      setPatients([]);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Debug log
    console.log('Submitting appointment:', formData);

    // Validation
    if (!formData.patientId) {
      toast.error('Patient is required');
      setFormLoading(false);
      return;
    }
    if (!formData.doctorId) {
      toast.error('Doctor is required');
      setFormLoading(false);
      return;
    }

    try {
      if (selectedAppointment) {
        await appointmentsAPI.update(selectedAppointment._id, formData);
        toast.success('Appointment updated successfully');
      } else {
        await appointmentsAPI.create(formData);
        toast.success('Appointment booked successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchAppointments();
    } catch (error) {
      console.error('Appointment error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (appointment, status) => {
    try {
      if (status === 'COMPLETED') {
        await appointmentsAPI.complete(appointment._id);
      } else if (status === 'CANCELLED') {
        await appointmentsAPI.cancel(appointment._id, { reason: 'Cancelled by user' });
      } else {
        await appointmentsAPI.updateStatus(appointment._id, { status });
      }
      toast.success(`Appointment ${status.toLowerCase()}`);
      fetchAppointments();
    } catch (error) {
      console.error('Status update error:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleEdit = (appointment) => {
    setSelectedAppointment(appointment);
    setFormData({
      patientId: appointment.patientId?._id || '',
      doctorId: appointment.doctorId?._id || '',
      date: appointment.date ? appointment.date.split('T')[0] : '',
      time: appointment.time || '',
      type: appointment.type || 'Consultation',
      symptoms: appointment.symptoms || '',
      notes: appointment.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (appointment) => {
    if (window.confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await appointmentsAPI.cancel(appointment._id, { reason: 'Cancelled by user' });
        toast.success('Appointment cancelled');
        fetchAppointments();
      } catch (error) {
        console.error('Cancel error:', error.response?.data);
        toast.error(error.response?.data?.message || 'Failed to cancel appointment');
      }
    }
  };

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setSelectedAppointment(null);
    // For patients, use their stored patient ID
    const defaultPatientId = user?.role === 'PATIENT' ? currentPatientId : '';
    setFormData({
      patientId: defaultPatientId,
      doctorId: '',
      date: '',
      time: '',
      type: 'Consultation',
      symptoms: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      SCHEDULED: 'warning',
      CONFIRMED: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger',
      NO_SHOW: 'secondary'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'appointmentId',
      label: 'ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'patient',
      label: 'Patient',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">
            {row.patientId?.userId?.name || 'Unknown'}
          </p>
          <p className="text-xs text-slate-500">{row.patientId?.patientId}</p>
        </div>
      )
    },
    {
      key: 'doctor',
      label: 'Doctor',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">
            Dr. {row.doctorId?.userId?.name || 'Unknown'}
          </p>
          <p className="text-xs text-slate-500">{row.doctorId?.specialization}</p>
        </div>
      )
    },
    {
      key: 'dateTime',
      label: 'Date & Time',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">
            {new Date(row.date).toLocaleDateString()}
          </p>
          <p className="text-xs text-slate-500">{row.time}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => <Badge variant="info">{value}</Badge>
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleView(row)}
            className="p-1 text-slate-500 hover:text-blue-600"
            title="View"
          >
            <FiEye className="w-4 h-4" />
          </button>
          {row.status === 'SCHEDULED' && (
            <>
              <button
                onClick={() => handleStatusUpdate(row, 'CONFIRMED')}
                className="p-1 text-slate-500 hover:text-green-600"
                title="Confirm"
              >
                <FiCheck className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEdit(row)}
                className="p-1 text-slate-500 hover:text-yellow-600"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(row)}
                className="p-1 text-slate-500 hover:text-red-600"
                title="Cancel"
              >
                <FiX className="w-4 h-4" />
              </button>
            </>
          )}
          {row.status === 'CONFIRMED' && (
            <button
              onClick={() => handleStatusUpdate(row, 'COMPLETED')}
              className="p-1 text-slate-500 hover:text-green-600"
              title="Mark Complete"
            >
              <FiCheck className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const typeOptions = [
    { value: 'Consultation', label: 'Consultation' },
    { value: 'Follow-up', label: 'Follow-up' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'Routine Checkup', label: 'Routine Checkup' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    '04:00 PM', '04:30 PM', '05:00 PM'
  ];

  if (loading && appointments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Appointments</h1>
          <p className="text-slate-500">Schedule and manage appointments</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Book Appointment
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className="w-48"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={appointments}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search appointments..."
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedAppointment ? 'Edit Appointment' : 'Book New Appointment'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Patient"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            options={patients.filter(p => p && p.userId).map((p) => ({
              value: p._id,
              label: `${p.userId.name || 'Unknown'} (${p.patientId || 'N/A'})`
            }))}
            required
            disabled={user?.role === 'PATIENT'}
          />

          <Select
            label="Doctor"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            options={doctors.filter(d => d && d.userId).map((d) => ({
              value: d._id,
              label: `Dr. ${d.userId.name || 'Unknown'} - ${d.specialization || 'General'}`
            }))}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              icon={FiCalendar}
              required
            />
            <Select
              label="Time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              options={timeSlots.map((t) => ({ value: t, label: t }))}
              required
            />
          </div>

          <Select
            label="Appointment Type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={typeOptions}
            required
          />

          <Input
            label="Symptoms / Reason for Visit"
            name="symptoms"
            value={formData.symptoms}
            onChange={handleChange}
            placeholder="Brief description of symptoms or reason"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any additional information..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              {selectedAppointment ? 'Update' : 'Book'} Appointment
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Appointment Details"
        size="lg"
      >
        {selectedAppointment && (
          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex justify-between items-center">
              <span className="font-mono text-sm text-slate-500">
                {selectedAppointment.appointmentId}
              </span>
              {getStatusBadge(selectedAppointment.status)}
            </div>

            {/* Patient & Doctor */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Patient</p>
                <p className="font-semibold text-slate-800">
                  {selectedAppointment.patientId?.userId?.name}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedAppointment.patientId?.patientId}
                </p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Doctor</p>
                <p className="font-semibold text-slate-800">
                  Dr. {selectedAppointment.doctorId?.userId?.name}
                </p>
                <p className="text-sm text-slate-500">
                  {selectedAppointment.doctorId?.specialization}
                </p>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Date</p>
                <p className="font-medium">
                  {new Date(selectedAppointment.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Time</p>
                <p className="font-medium">{selectedAppointment.time}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Type</p>
                <Badge variant="info">{selectedAppointment.type}</Badge>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium">
                  {new Date(selectedAppointment.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Symptoms & Notes */}
            {selectedAppointment.symptoms && (
              <div className="border-t pt-4">
                <p className="text-sm text-slate-500 mb-1">Symptoms / Reason</p>
                <p className="text-slate-700">{selectedAppointment.symptoms}</p>
              </div>
            )}

            {selectedAppointment.notes && (
              <div className="border-t pt-4">
                <p className="text-sm text-slate-500 mb-1">Notes</p>
                <p className="text-slate-700">{selectedAppointment.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Appointments;
