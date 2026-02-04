/**
 * IPD Records Page
 * Inpatient department admissions management
 */

import { useState, useEffect } from 'react';
import { ipdAPI, doctorsAPI, patientsAPI, bedsAPI } from '../../services/api';
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
  FiEye,
  FiLogOut
} from 'react-icons/fi';

const IPDRecords = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [beds, setBeds] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    bedId: '',
    admissionDate: '',
    admissionReason: '',
    diagnosis: '',
    notes: ''
  });
  const [dischargeData, setDischargeData] = useState({
    dischargeDate: '',
    dischargeSummary: '',
    dischargeNotes: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchDoctors();
    fetchPatients();
    fetchBeds();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await ipdAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      setRecords(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch IPD records', error);
      toast.error('Failed to fetch IPD records');
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
    try {
      const response = await patientsAPI.getAll({ limit: 100 });
      setPatients(response.data.data);
    } catch (error) {
      console.error('Failed to fetch patients');
    }
  };

  const fetchBeds = async () => {
    try {
      const response = await bedsAPI.getAll({ status: 'AVAILABLE', limit: 100 });
      setBeds(response.data.data);
    } catch (error) {
      console.error('Failed to fetch beds');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDischargeChange = (e) => {
    setDischargeData({ ...dischargeData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (selectedRecord) {
        await ipdAPI.update(selectedRecord._id, formData);
        toast.success('IPD record updated successfully');
      } else {
        await ipdAPI.create(formData);
        toast.success('Patient admitted successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchRecords();
      fetchBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDischarge = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await ipdAPI.discharge(selectedRecord._id, dischargeData);
      toast.success('Patient discharged successfully');
      setIsDischargeModalOpen(false);
      resetDischargeForm();
      fetchRecords();
      fetchBeds();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Discharge failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      patientId: record.patientId?._id || '',
      doctorId: record.doctorId?._id || '',
      bedId: record.bedId?._id || '',
      admissionDate: record.admissionDate ? record.admissionDate.split('T')[0] : '',
      admissionReason: record.admissionReason || '',
      diagnosis: record.diagnosis || '',
      notes: record.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const openDischargeModal = (record) => {
    setSelectedRecord(record);
    setDischargeData({
      dischargeDate: new Date().toISOString().split('T')[0],
      dischargeSummary: '',
      dischargeNotes: ''
    });
    setIsDischargeModalOpen(true);
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setFormData({
      patientId: '',
      doctorId: '',
      bedId: '',
      admissionDate: '',
      admissionReason: '',
      diagnosis: '',
      notes: ''
    });
  };

  const resetDischargeForm = () => {
    setSelectedRecord(null);
    setDischargeData({
      dischargeDate: '',
      dischargeSummary: '',
      dischargeNotes: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      ADMITTED: 'warning',
      DISCHARGED: 'success',
      TRANSFERRED: 'info'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'ipdId',
      label: 'IPD ID',
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
      label: 'Attending Doctor',
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
      key: 'bed',
      label: 'Bed/Ward',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.bedId?.bedNumber || '-'}</p>
          <p className="text-xs text-slate-500">{row.bedId?.ward}</p>
        </div>
      )
    },
    {
      key: 'admissionDate',
      label: 'Admitted',
      render: (value) => new Date(value).toLocaleDateString()
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleView(row)}
            className="p-1 text-slate-500 hover:text-blue-600"
            title="View"
          >
            <FiEye className="w-4 h-4" />
          </button>
          {row.status === 'ADMITTED' && (
            <>
              <button
                onClick={() => handleEdit(row)}
                className="p-1 text-slate-500 hover:text-yellow-600"
                title="Edit"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => openDischargeModal(row)}
                className="p-1 text-slate-500 hover:text-green-600"
                title="Discharge"
              >
                <FiLogOut className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'ADMITTED', label: 'Admitted' },
    { value: 'DISCHARGED', label: 'Discharged' },
    { value: 'TRANSFERRED', label: 'Transferred' }
  ];

  if (loading && records.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">IPD Records</h1>
          <p className="text-slate-500">Manage inpatient admissions and discharges</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          New Admission
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
        data={records}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search IPD records..."
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
      />

      {/* Admission Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedRecord ? 'Edit IPD Record' : 'New Patient Admission'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Patient"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            options={patients.map((p) => ({
              value: p._id,
              label: `${p.userId?.name} (${p.patientId})`
            }))}
            required
          />

          <Select
            label="Attending Doctor"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            options={doctors.map((d) => ({
              value: d._id,
              label: `Dr. ${d.userId?.name} - ${d.specialization}`
            }))}
            required
          />

          <Select
            label="Bed"
            name="bedId"
            value={formData.bedId}
            onChange={handleChange}
            options={beds.map((b) => ({
              value: b._id,
              label: `${b.bedNumber} - ${b.ward} (${b.bedType})`
            }))}
            required
          />

          <Input
            label="Admission Date"
            type="date"
            name="admissionDate"
            value={formData.admissionDate}
            onChange={handleChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Reason for Admission
            </label>
            <textarea
              name="admissionReason"
              value={formData.admissionReason}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Initial Diagnosis
            </label>
            <textarea
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              {selectedRecord ? 'Update' : 'Admit'} Patient
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discharge Modal */}
      <Modal
        isOpen={isDischargeModalOpen}
        onClose={() => {
          setIsDischargeModalOpen(false);
          resetDischargeForm();
        }}
        title="Discharge Patient"
        size="lg"
      >
        <form onSubmit={handleDischarge} className="space-y-4">
          {selectedRecord && (
            <div className="p-4 bg-slate-50 rounded-lg mb-4">
              <p className="font-medium text-slate-800">
                {selectedRecord.patientId?.userId?.name}
              </p>
              <p className="text-sm text-slate-500">
                {selectedRecord.ipdId} | Admitted: {new Date(selectedRecord.admissionDate).toLocaleDateString()}
              </p>
            </div>
          )}

          <Input
            label="Discharge Date"
            type="date"
            name="dischargeDate"
            value={dischargeData.dischargeDate}
            onChange={handleDischargeChange}
            required
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Discharge Summary
            </label>
            <textarea
              name="dischargeSummary"
              value={dischargeData.dischargeSummary}
              onChange={handleDischargeChange}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Treatment summary, outcomes, medications on discharge..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Additional Notes
            </label>
            <textarea
              name="dischargeNotes"
              value={dischargeData.dischargeNotes}
              onChange={handleDischargeChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Follow-up instructions, precautions..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDischargeModalOpen(false);
                resetDischargeForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Discharge Patient
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="IPD Record Details"
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-sm text-slate-500">{selectedRecord.ipdId}</span>
                {getStatusBadge(selectedRecord.status)}
              </div>
            </div>

            {/* Patient & Doctor */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Patient</p>
                <p className="font-semibold text-slate-800">
                  {selectedRecord.patientId?.userId?.name}
                </p>
                <p className="text-sm text-slate-500">{selectedRecord.patientId?.patientId}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Attending Doctor</p>
                <p className="font-semibold text-slate-800">
                  Dr. {selectedRecord.doctorId?.userId?.name}
                </p>
                <p className="text-sm text-slate-500">{selectedRecord.doctorId?.specialization}</p>
              </div>
            </div>

            {/* Bed Info */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 mb-1">Bed Assignment</p>
              <p className="font-semibold text-slate-800">
                {selectedRecord.bedId?.bedNumber} - {selectedRecord.bedId?.ward}
              </p>
              <p className="text-sm text-slate-500">
                {selectedRecord.bedId?.bedType} | ₹{selectedRecord.bedId?.chargesPerDay}/day
              </p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Admission Date</p>
                <p className="font-medium">
                  {new Date(selectedRecord.admissionDate).toLocaleDateString()}
                </p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">
                  {selectedRecord.status === 'DISCHARGED' ? 'Discharge Date' : 'Duration'}
                </p>
                <p className="font-medium">
                  {selectedRecord.dischargeDate
                    ? new Date(selectedRecord.dischargeDate).toLocaleDateString()
                    : `${Math.ceil((new Date() - new Date(selectedRecord.admissionDate)) / (1000 * 60 * 60 * 24))} days`}
                </p>
              </div>
            </div>

            {/* Admission Details */}
            <div className="border-t pt-4">
              <h4 className="font-medium text-slate-800 mb-2">Admission Reason</h4>
              <p className="text-slate-600">{selectedRecord.admissionReason}</p>
            </div>

            {selectedRecord.diagnosis && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Diagnosis</h4>
                <p className="text-slate-600">{selectedRecord.diagnosis}</p>
              </div>
            )}

            {selectedRecord.dischargeSummary && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Discharge Summary</h4>
                <p className="text-slate-600">{selectedRecord.dischargeSummary}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default IPDRecords;
