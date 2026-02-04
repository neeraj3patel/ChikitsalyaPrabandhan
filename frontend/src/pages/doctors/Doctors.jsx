/**
 * Doctors Page
 * Doctor management with CRUD operations
 */

import { useState, useEffect } from 'react';
import { doctorsAPI } from '../../services/api';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiUser,
  FiMail,
  FiPhone,
  FiCalendar
} from 'react-icons/fi';

const Doctors = () => {
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    specialization: '',
    department: '',
    qualification: '',
    experience: '',
    consultationFee: '',
    licenseNumber: '',
    availableDays: [],
    availableTimeSlots: [{ start: '09:00', end: '17:00' }]
  });

  useEffect(() => {
    fetchDoctors();
  }, [pagination.page, searchTerm]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await doctorsAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm
      });
      setDoctors(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch doctors', error);
      toast.error('Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'availableDays') {
      let updatedDays = [...formData.availableDays];
      if (checked) {
        updatedDays.push(value);
      } else {
        updatedDays = updatedDays.filter((d) => d !== value);
      }
      setFormData({ ...formData, availableDays: updatedDays });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTimeSlotChange = (index, field, value) => {
    const updatedSlots = [...formData.availableTimeSlots];
    updatedSlots[index][field] = value;
    setFormData({ ...formData, availableTimeSlots: updatedSlots });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    // Convert availableDays and timeSlots to availability format expected by backend
    const availability = formData.availableDays.map(day => ({
      day,
      startTime: formData.availableTimeSlots[0]?.start || '09:00',
      endTime: formData.availableTimeSlots[0]?.end || '17:00',
      maxPatients: 20
    }));

    try {
      if (selectedDoctor) {
        // For update
        await doctorsAPI.update(selectedDoctor._id, {
          userData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            ...(formData.password && { password: formData.password })
          },
          doctorData: {
            specialization: formData.specialization,
            department: formData.department || formData.specialization,
            qualification: [{ degree: formData.qualification, institution: '', year: new Date().getFullYear() }],
            experience: parseInt(formData.experience) || 0,
            consultationFee: parseFloat(formData.consultationFee) || 0,
            licenseNumber: formData.licenseNumber,
            availability
          }
        });
        toast.success('Doctor updated successfully');
      } else {
        // For create
        await doctorsAPI.create({
          userData: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone
          },
          doctorData: {
            specialization: formData.specialization,
            department: formData.department || formData.specialization,
            qualification: [{ degree: formData.qualification, institution: '', year: new Date().getFullYear() }],
            experience: parseInt(formData.experience) || 0,
            consultationFee: parseFloat(formData.consultationFee) || 0,
            licenseNumber: formData.licenseNumber,
            availability
          }
        });
        toast.success('Doctor created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (doctor) => {
    setSelectedDoctor(doctor);
    // Extract days from availability array
    const availableDays = doctor.availability?.map(a => a.day) || [];
    const startTime = doctor.availability?.[0]?.startTime || '09:00';
    const endTime = doctor.availability?.[0]?.endTime || '17:00';
    
    setFormData({
      name: doctor.userId?.name || '',
      email: doctor.userId?.email || '',
      password: '',
      phone: doctor.userId?.phone || '',
      specialization: doctor.specialization || '',
      department: doctor.department || '',
      qualification: doctor.qualification?.[0]?.degree || '',
      experience: doctor.experience?.toString() || '',
      consultationFee: doctor.consultationFee?.toString() || '',
      licenseNumber: doctor.licenseNumber || '',
      availableDays,
      availableTimeSlots: [{ start: startTime, end: endTime }]
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (doctor) => {
    if (window.confirm('Are you sure you want to delete this doctor?')) {
      try {
        await doctorsAPI.delete(doctor._id);
        toast.success('Doctor deleted successfully');
        fetchDoctors();
      } catch (error) {
        toast.error('Failed to delete doctor');
      }
    }
  };

  const handleView = (doctor) => {
    setSelectedDoctor(doctor);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setSelectedDoctor(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      specialization: '',
      department: '',
      qualification: '',
      experience: '',
      consultationFee: '',
      licenseNumber: '',
      availableDays: [],
      availableTimeSlots: [{ start: '09:00', end: '17:00' }]
    });
  };

  const columns = [
    {
      key: 'doctorId',
      label: 'Doctor ID',
      render: (value) => <span className="font-mono text-sm">{value || '-'}</span>
    },
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-medium">
            {row?.userId?.name?.charAt(0) || 'D'}
          </div>
          <div>
            <p className="font-medium text-slate-800">Dr. {row?.userId?.name || 'Unknown'}</p>
            <p className="text-xs text-slate-500">{row?.userId?.email || '-'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (value) => value ? <Badge variant="info">{value}</Badge> : '-'
    },
    {
      key: 'experience',
      label: 'Experience',
      render: (value) => value ? `${value} years` : '-'
    },
    {
      key: 'consultationFee',
      label: 'Fee',
      render: (value) => value ? `₹${value}` : '-'
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => (
        <Badge variant={row?.userId?.isActive !== false ? 'success' : 'danger'}>
          {row?.userId?.isActive !== false ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-1 text-slate-500 hover:text-blue-600"
            title="View"
          >
            <FiEye className="w-4 h-4" />
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
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const specializations = [
    'General Medicine',
    'Cardiology',
    'Dermatology',
    'Orthopedics',
    'Pediatrics',
    'Neurology',
    'Gynecology',
    'Ophthalmology',
    'ENT',
    'Dentistry',
    'Psychiatry',
    'Radiology'
  ];

  const weekDays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];

  if (loading && doctors.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-slate-500">Manage doctor profiles and schedules</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Add Doctor
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={doctors}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search doctors..."
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
        title={selectedDoctor ? 'Edit Doctor' : 'Add New Doctor'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              icon={FiUser}
              required
            />
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              icon={FiMail}
              required
            />
          </div>

          {!selectedDoctor && (
            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              icon={FiPhone}
            />
            <Select
              label="Specialization"
              name="specialization"
              value={formData.specialization}
              onChange={handleChange}
              options={specializations.map((s) => ({ value: s, label: s }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              options={specializations.map((s) => ({ value: s, label: s }))}
              required
            />
            <Input
              label="License Number"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleChange}
              placeholder="e.g., MED123456"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Qualification"
              name="qualification"
              value={formData.qualification}
              onChange={handleChange}
              placeholder="e.g., MBBS, MD"
            />
            <Input
              label="Experience (years)"
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Consultation Fee (₹)"
            type="number"
            name="consultationFee"
            value={formData.consultationFee}
            onChange={handleChange}
          />

          {/* Available Days */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Available Days
            </label>
            <div className="flex flex-wrap gap-3">
              {weekDays.map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="availableDays"
                    value={day}
                    checked={formData.availableDays.includes(day)}
                    onChange={handleChange}
                    className="rounded border-slate-300 text-blue-600"
                  />
                  <span className="text-sm text-slate-600">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Working Hours
            </label>
            <div className="flex items-center gap-4">
              <Input
                label="Start Time"
                type="time"
                value={formData.availableTimeSlots[0]?.start || '09:00'}
                onChange={(e) => handleTimeSlotChange(0, 'start', e.target.value)}
              />
              <span className="text-slate-500 mt-6">to</span>
              <Input
                label="End Time"
                type="time"
                value={formData.availableTimeSlots[0]?.end || '17:00'}
                onChange={(e) => handleTimeSlotChange(0, 'end', e.target.value)}
              />
            </div>
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
              {selectedDoctor ? 'Update' : 'Create'} Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Doctor Details"
        size="lg"
      >
        {selectedDoctor && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl font-medium">
                {selectedDoctor.userId?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  Dr. {selectedDoctor.userId?.name}
                </h3>
                <p className="text-slate-500">{selectedDoctor.doctorId}</p>
                <Badge variant="info">{selectedDoctor.specialization}</Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{selectedDoctor.userId?.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium">{selectedDoctor.userId?.phone || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Qualification</p>
                <p className="font-medium">{selectedDoctor.qualification || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Experience</p>
                <p className="font-medium">{selectedDoctor.experience} years</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Consultation Fee</p>
                <p className="font-medium">₹{selectedDoctor.consultationFee}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant={selectedDoctor.isAvailable ? 'success' : 'danger'}>
                  {selectedDoctor.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-800 mb-2">Schedule</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedDoctor.availableDays?.map((day) => (
                  <Badge key={day} variant="info">{day}</Badge>
                ))}
              </div>
              <p className="text-slate-600">
                {selectedDoctor.availableTimeSlots?.[0]?.start} - {selectedDoctor.availableTimeSlots?.[0]?.end}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Doctors;
