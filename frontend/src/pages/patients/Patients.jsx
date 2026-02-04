/**
 * Patients Page
 * Patient management with CRUD operations
 */

import { useState, useEffect } from 'react';
import { patientsAPI } from '../../services/api';
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
  FiPhone
} from 'react-icons/fi';

const Patients = () => {
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    }
  });

  useEffect(() => {
    fetchPatients();
  }, [pagination.page, searchTerm]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await patientsAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm
      });
      setPatients(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch patients', error);
      toast.error('Failed to fetch patients');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!selectedPatient && !formData.password) {
      toast.error('Password is required for new patients');
      return;
    }
    if (!formData.dateOfBirth) {
      toast.error('Date of birth is required');
      return;
    }
    if (!formData.gender) {
      toast.error('Gender is required');
      return;
    }
    
    setFormLoading(true);

    try {
      if (selectedPatient) {
        // For update, send flat structure
        await patientsAPI.update(selectedPatient._id, {
          userData: {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            ...(formData.password && { password: formData.password })
          },
          patientData: {
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            bloodGroup: formData.bloodGroup,
            address: formData.address,
            emergencyContact: formData.emergencyContact
          }
        });
        toast.success('Patient updated successfully');
      } else {
        // For create, send userData and patientData separately
        await patientsAPI.create({
          userData: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone
          },
          patientData: {
            dateOfBirth: formData.dateOfBirth,
            gender: formData.gender,
            bloodGroup: formData.bloodGroup,
            address: formData.address,
            emergencyContact: formData.emergencyContact
          }
        });
        toast.success('Patient created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchPatients();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.userId?.name || '',
      email: patient.userId?.email || '',
      password: '',
      phone: patient.userId?.phone || '',
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
      gender: patient.gender || '',
      bloodGroup: patient.bloodGroup || '',
      address: patient.address || { street: '', city: '', state: '', zipCode: '' },
      emergencyContact: patient.emergencyContact || { name: '', relationship: '', phone: '' }
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (patient) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      try {
        await patientsAPI.delete(patient._id);
        toast.success('Patient deleted successfully');
        fetchPatients();
      } catch (error) {
        toast.error('Failed to delete patient');
      }
    }
  };

  const handleView = (patient) => {
    setSelectedPatient(patient);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      bloodGroup: '',
      address: { street: '', city: '', state: '', zipCode: '' },
      emergencyContact: { name: '', relationship: '', phone: '' }
    });
  };

  const columns = [
    {
      key: 'patientId',
      label: 'Patient ID',
      render: (value) => <span className="font-mono text-sm">{value || '-'}</span>
    },
    {
      key: 'name',
      label: 'Name',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
            {row?.userId?.name?.charAt(0) || row?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <p className="font-medium text-slate-800">{row?.userId?.name || row?.name || 'Unknown'}</p>
            <p className="text-xs text-slate-500">{row?.userId?.email || row?.email || '-'}</p>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (_, row) => row?.userId?.phone || row?.phone || '-'
    },
    {
      key: 'gender',
      label: 'Gender'
    },
    {
      key: 'bloodGroup',
      label: 'Blood Group',
      render: (value) => value ? <Badge variant="info">{value}</Badge> : '-'
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

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const bloodGroupOptions = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' }
  ];

  if (loading && patients.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Patients</h1>
          <p className="text-slate-500">Manage patient records</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Add Patient
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={patients}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search patients..."
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
        title={selectedPatient ? 'Edit Patient' : 'Add New Patient'}
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

          {!selectedPatient && (
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
            <Input
              label="Date of Birth"
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={genderOptions}
              required
            />
            <Select
              label="Blood Group"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              options={bloodGroupOptions}
            />
          </div>

          {/* Address */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-slate-800 mb-3">Address</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Street"
                name="address.street"
                value={formData.address.street}
                onChange={handleChange}
              />
              <Input
                label="City"
                name="address.city"
                value={formData.address.city}
                onChange={handleChange}
              />
              <Input
                label="State"
                name="address.state"
                value={formData.address.state}
                onChange={handleChange}
              />
              <Input
                label="Zip Code"
                name="address.zipCode"
                value={formData.address.zipCode}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-slate-800 mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="Name"
                name="emergencyContact.name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
              />
              <Input
                label="Relationship"
                name="emergencyContact.relationship"
                value={formData.emergencyContact.relationship}
                onChange={handleChange}
              />
              <Input
                label="Phone"
                name="emergencyContact.phone"
                value={formData.emergencyContact.phone}
                onChange={handleChange}
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
              {selectedPatient ? 'Update' : 'Create'} Patient
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Patient Details"
        size="lg"
      >
        {selectedPatient && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-medium">
                {selectedPatient.userId?.name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800">
                  {selectedPatient.userId?.name}
                </h3>
                <p className="text-slate-500">{selectedPatient.patientId}</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{selectedPatient.userId?.email}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium">{selectedPatient.userId?.phone || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Gender</p>
                <p className="font-medium">{selectedPatient.gender || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Blood Group</p>
                <p className="font-medium">{selectedPatient.bloodGroup || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Date of Birth</p>
                <p className="font-medium">
                  {selectedPatient.dateOfBirth
                    ? new Date(selectedPatient.dateOfBirth).toLocaleDateString()
                    : '-'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Registration Date</p>
                <p className="font-medium">
                  {new Date(selectedPatient.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Address */}
            {selectedPatient.address && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Address</h4>
                <p className="text-slate-600">
                  {selectedPatient.address.street}, {selectedPatient.address.city},{' '}
                  {selectedPatient.address.state} - {selectedPatient.address.zipCode}
                </p>
              </div>
            )}

            {/* Emergency Contact */}
            {selectedPatient.emergencyContact?.name && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Emergency Contact</h4>
                <p className="text-slate-600">
                  {selectedPatient.emergencyContact.name} ({selectedPatient.emergencyContact.relationship})
                  - {selectedPatient.emergencyContact.phone}
                </p>
              </div>
            )}

            {/* Medical Info */}
            {selectedPatient.allergies?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Allergies</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPatient.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="danger">{allergy}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Patients;
