/**
 * Beds Management Page
 * Ward and bed management
 */

import { useState, useEffect } from 'react';
import { bedsAPI } from '../../services/api';
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
  FiGrid
} from 'react-icons/fi';

const Beds = () => {
  const [loading, setLoading] = useState(true);
  const [beds, setBeds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [wardFilter, setWardFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBed, setSelectedBed] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    bedNumber: '',
    ward: '',
    floor: '',
    bedType: 'GENERAL',
    chargesPerDay: '',
    status: 'AVAILABLE'
  });

  useEffect(() => {
    fetchBeds();
  }, [pagination.page, searchTerm, statusFilter, wardFilter]);

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const response = await bedsAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        ward: wardFilter
      });
      setBeds(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch beds', error);
      toast.error('Failed to fetch beds');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        floor: parseInt(formData.floor) || 1,
        chargesPerDay: parseFloat(formData.chargesPerDay) || 0
      };

      if (selectedBed) {
        await bedsAPI.update(selectedBed._id, payload);
        toast.success('Bed updated successfully');
      } else {
        await bedsAPI.create(payload);
        toast.success('Bed created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (bed) => {
    setSelectedBed(bed);
    setFormData({
      bedNumber: bed.bedNumber || '',
      ward: bed.ward || '',
      floor: bed.floor?.toString() || '',
      bedType: bed.bedType || 'GENERAL',
      chargesPerDay: bed.chargesPerDay?.toString() || '',
      status: bed.status || 'AVAILABLE'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (bed) => {
    if (bed.status === 'OCCUPIED') {
      toast.error('Cannot delete an occupied bed');
      return;
    }
    if (window.confirm('Are you sure you want to delete this bed?')) {
      try {
        await bedsAPI.delete(bed._id);
        toast.success('Bed deleted successfully');
        fetchBeds();
      } catch (error) {
        toast.error('Failed to delete bed');
      }
    }
  };

  const resetForm = () => {
    setSelectedBed(null);
    setFormData({
      bedNumber: '',
      ward: '',
      floor: '',
      bedType: 'GENERAL',
      chargesPerDay: '',
      status: 'AVAILABLE'
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      AVAILABLE: 'success',
      OCCUPIED: 'danger',
      MAINTENANCE: 'warning',
      RESERVED: 'info'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'bedNumber',
      label: 'Bed Number',
      render: (value) => <span className="font-mono font-medium">{value}</span>
    },
    {
      key: 'ward',
      label: 'Ward'
    },
    {
      key: 'floor',
      label: 'Floor',
      render: (value) => `Floor ${value}`
    },
    {
      key: 'bedType',
      label: 'Type',
      render: (value) => <Badge variant="info">{value}</Badge>
    },
    {
      key: 'chargesPerDay',
      label: 'Charges/Day',
      render: (value) => `₹${value}`
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'currentPatient',
      label: 'Patient',
      render: (_, row) => row.currentPatient?.userId?.name || '-'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="p-1 text-slate-500 hover:text-yellow-600"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          {row.status !== 'OCCUPIED' && (
            <button
              onClick={() => handleDelete(row)}
              className="p-1 text-slate-500 hover:text-red-600"
              title="Delete"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const wardOptions = [
    { value: '', label: 'All Wards' },
    { value: 'General Ward', label: 'General Ward' },
    { value: 'ICU', label: 'ICU' },
    { value: 'NICU', label: 'NICU' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'Pediatric', label: 'Pediatric' },
    { value: 'Maternity', label: 'Maternity' },
    { value: 'Surgery', label: 'Surgery' },
    { value: 'Orthopedic', label: 'Orthopedic' }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'AVAILABLE', label: 'Available' },
    { value: 'OCCUPIED', label: 'Occupied' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'RESERVED', label: 'Reserved' }
  ];

  const bedTypeOptions = [
    { value: 'GENERAL', label: 'General' },
    { value: 'SEMI_PRIVATE', label: 'Semi-Private' },
    { value: 'PRIVATE', label: 'Private' },
    { value: 'ICU', label: 'ICU' },
    { value: 'NICU', label: 'NICU' },
    { value: 'EMERGENCY', label: 'Emergency' }
  ];

  // Calculate stats
  const stats = {
    total: beds.length,
    available: beds.filter(b => b.status === 'AVAILABLE').length,
    occupied: beds.filter(b => b.status === 'OCCUPIED').length,
    maintenance: beds.filter(b => b.status === 'MAINTENANCE').length
  };

  if (loading && beds.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Beds & Wards</h1>
          <p className="text-slate-500">Manage hospital beds and ward allocations</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Add Bed
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiGrid className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Beds</p>
              <p className="text-xl font-semibold text-slate-800">{pagination.total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiGrid className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Available</p>
              <p className="text-xl font-semibold text-green-600">{stats.available}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiGrid className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Occupied</p>
              <p className="text-xl font-semibold text-red-600">{stats.occupied}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiGrid className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Maintenance</p>
              <p className="text-xl font-semibold text-yellow-600">{stats.maintenance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusOptions}
          className="w-48"
        />
        <Select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          options={wardOptions}
          className="w-48"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={beds}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search beds..."
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
        title={selectedBed ? 'Edit Bed' : 'Add New Bed'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bed Number"
            name="bedNumber"
            value={formData.bedNumber}
            onChange={handleChange}
            placeholder="e.g., A-101"
            required
          />

          <Select
            label="Ward"
            name="ward"
            value={formData.ward}
            onChange={handleChange}
            options={wardOptions.filter(w => w.value !== '')}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Floor"
              type="number"
              name="floor"
              value={formData.floor}
              onChange={handleChange}
              min="1"
              required
            />
            <Select
              label="Bed Type"
              name="bedType"
              value={formData.bedType}
              onChange={handleChange}
              options={bedTypeOptions}
              required
            />
          </div>

          <Input
            label="Charges Per Day (₹)"
            type="number"
            name="chargesPerDay"
            value={formData.chargesPerDay}
            onChange={handleChange}
            min="0"
            required
          />

          <Select
            label="Status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            options={statusOptions.filter(s => s.value !== '')}
            required
          />

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
              {selectedBed ? 'Update' : 'Add'} Bed
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Beds;
