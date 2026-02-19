/**
 * OPD Records Page
 * Outpatient department records management
 */

import { useState, useEffect } from 'react';
import { opdAPI, doctorsAPI, patientsAPI } from '../../services/api';
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
  FiFileText
} from 'react-icons/fi';

const OPDRecords = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentId: '',
    symptoms: '',
    diagnosis: '',
    prescription: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
    vitals: {
      bloodPressure: '',
      temperature: '',
      pulse: '',
      weight: '',
      height: ''
    },
    notes: '',
    followUpDate: ''
  });

  useEffect(() => {
    fetchRecords();
    fetchDoctors();
    fetchPatients();
  }, [pagination.page, searchTerm]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await opdAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm
      });
      setRecords(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch OPD records', error);
      toast.error('Failed to fetch OPD records');
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

  const handlePrescriptionChange = (index, field, value) => {
    const updated = [...formData.prescription];
    updated[index][field] = value;
    setFormData({ ...formData, prescription: updated });
  };

  const addPrescriptionItem = () => {
    setFormData({
      ...formData,
      prescription: [...formData.prescription, { medicine: '', dosage: '', duration: '', instructions: '' }]
    });
  };

  const removePrescriptionItem = (index) => {
    const updated = formData.prescription.filter((_, i) => i !== index);
    setFormData({ ...formData, prescription: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      // Prepare data - remove empty appointmentId to avoid ObjectId cast error
      const submitData = { ...formData };
      if (!submitData.appointmentId) {
        delete submitData.appointmentId;
      }
      
      // Convert diagnosis string to object format expected by backend
      if (typeof submitData.diagnosis === 'string') {
        submitData.diagnosis = {
          primary: submitData.diagnosis,
          secondary: [],
          notes: ''
        };
      }
      
      // Convert vitals to vitalSigns format expected by backend
      if (submitData.vitals) {
        submitData.vitalSigns = {
          bloodPressure: submitData.vitals.bloodPressure,
          pulse: submitData.vitals.pulse ? Number(submitData.vitals.pulse) : undefined,
          temperature: submitData.vitals.temperature ? Number(submitData.vitals.temperature) : undefined,
          weight: submitData.vitals.weight ? Number(submitData.vitals.weight) : undefined,
          height: submitData.vitals.height ? Number(submitData.vitals.height) : undefined
        };
        delete submitData.vitals;
      }
      
      if (selectedRecord) {
        await opdAPI.update(selectedRecord._id, submitData);
        toast.success('OPD record updated successfully');
      } else {
        await opdAPI.create(submitData);
        toast.success('OPD record created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchRecords();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (record) => {
    setSelectedRecord(record);
    setFormData({
      patientId: record.patientId?._id || '',
      doctorId: record.doctorId?._id || '',
      appointmentId: record.appointmentId?._id || '',
      symptoms: record.symptoms || '',
      diagnosis: record.diagnosis || '',
      prescription: record.prescription?.length > 0 
        ? record.prescription 
        : [{ medicine: '', dosage: '', duration: '', instructions: '' }],
      vitals: record.vitals || { bloodPressure: '', temperature: '', pulse: '', weight: '', height: '' },
      notes: record.notes || '',
      followUpDate: record.followUpDate ? record.followUpDate.split('T')[0] : ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (record) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await opdAPI.delete(record._id);
        toast.success('OPD record deleted');
        fetchRecords();
      } catch (error) {
        toast.error('Failed to delete record');
      }
    }
  };

  const handleView = (record) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const resetForm = () => {
    setSelectedRecord(null);
    setFormData({
      patientId: '',
      doctorId: '',
      appointmentId: '',
      symptoms: '',
      diagnosis: '',
      prescription: [{ medicine: '', dosage: '', duration: '', instructions: '' }],
      vitals: { bloodPressure: '', temperature: '', pulse: '', weight: '', height: '' },
      notes: '',
      followUpDate: ''
    });
  };

  const columns = [
    {
      key: 'opdId',
      label: 'OPD ID',
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
      key: 'diagnosis',
      label: 'Diagnosis',
      render: (value) => {
        // Handle both string and object formats
        if (typeof value === 'object' && value !== null) {
          return value.primary || '-';
        }
        return value || '-';
      }
    },
    {
      key: 'date',
      label: 'Visit Date',
      render: (_, row) => new Date(row.createdAt).toLocaleDateString()
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
          <h1 className="text-2xl font-bold text-slate-800">OPD Records</h1>
          <p className="text-slate-500">Manage outpatient department records</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          New OPD Record
        </Button>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={records}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search OPD records..."
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
        title={selectedRecord ? 'Edit OPD Record' : 'New OPD Record'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
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
              label="Doctor"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              options={doctors.map((d) => ({
                value: d._id,
                label: `Dr. ${d.userId?.name} - ${d.specialization}`
              }))}
              required
            />
          </div>

          {/* Vitals */}
          <div className="border-t pt-4">
            <h3 className="font-medium text-slate-800 mb-3">Vitals</h3>
            <div className="grid grid-cols-5 gap-4">
              <Input
                label="Blood Pressure"
                name="vitals.bloodPressure"
                value={formData.vitals.bloodPressure}
                onChange={handleChange}
                placeholder="120/80"
              />
              <Input
                label="Temperature (°F)"
                name="vitals.temperature"
                value={formData.vitals.temperature}
                onChange={handleChange}
                placeholder="98.6"
              />
              <Input
                label="Pulse (bpm)"
                name="vitals.pulse"
                value={formData.vitals.pulse}
                onChange={handleChange}
                placeholder="72"
              />
              <Input
                label="Weight (kg)"
                name="vitals.weight"
                value={formData.vitals.weight}
                onChange={handleChange}
                placeholder="70"
              />
              <Input
                label="Height (cm)"
                name="vitals.height"
                value={formData.vitals.height}
                onChange={handleChange}
                placeholder="170"
              />
            </div>
          </div>

          {/* Symptoms & Diagnosis */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Symptoms
                </label>
                <textarea
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Patient's symptoms..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Diagnosis
                </label>
                <textarea
                  name="diagnosis"
                  value={formData.diagnosis}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doctor's diagnosis..."
                />
              </div>
            </div>
          </div>

          {/* Prescription */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-800">Prescription</h3>
              <Button type="button" size="sm" variant="outline" onClick={addPrescriptionItem}>
                Add Medicine
              </Button>
            </div>
            {formData.prescription.map((item, index) => (
              <div key={index} className="grid grid-cols-5 gap-2 mb-2">
                <Input
                  placeholder="Medicine"
                  value={item.medicine}
                  onChange={(e) => handlePrescriptionChange(index, 'medicine', e.target.value)}
                />
                <Input
                  placeholder="Dosage"
                  value={item.dosage}
                  onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                />
                <Input
                  placeholder="Duration"
                  value={item.duration}
                  onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                />
                <Input
                  placeholder="Instructions"
                  value={item.instructions}
                  onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                />
                {formData.prescription.length > 1 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-red-500"
                    onClick={() => removePrescriptionItem(index)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Notes & Follow-up */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes..."
                />
              </div>
              <Input
                label="Follow-up Date"
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
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
              {selectedRecord ? 'Update' : 'Create'} Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="OPD Record Details"
        size="xl"
      >
        {selectedRecord && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-sm text-slate-500">{selectedRecord.opdId}</span>
                <p className="text-sm text-slate-500 mt-1">
                  {new Date(selectedRecord.createdAt).toLocaleString()}
                </p>
              </div>
              <Button variant="outline" size="sm" icon={FiFileText}>
                Print
              </Button>
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
                <p className="text-sm text-green-600 mb-1">Doctor</p>
                <p className="font-semibold text-slate-800">
                  Dr. {selectedRecord.doctorId?.userId?.name}
                </p>
                <p className="text-sm text-slate-500">{selectedRecord.doctorId?.specialization}</p>
              </div>
            </div>

            {/* Vitals */}
            {selectedRecord.vitals && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-3">Vitals</h4>
                <div className="grid grid-cols-5 gap-4">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">BP</p>
                    <p className="font-semibold">{selectedRecord.vitals.bloodPressure || '-'}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Temp</p>
                    <p className="font-semibold">{selectedRecord.vitals.temperature || '-'}°F</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Pulse</p>
                    <p className="font-semibold">{selectedRecord.vitals.pulse || '-'} bpm</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Weight</p>
                    <p className="font-semibold">{selectedRecord.vitals.weight || '-'} kg</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <p className="text-sm text-slate-500">Height</p>
                    <p className="font-semibold">{selectedRecord.vitals.height || '-'} cm</p>
                  </div>
                </div>
              </div>
            )}

            {/* Symptoms & Diagnosis */}
            <div className="border-t pt-4 grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Symptoms</h4>
                <p className="text-slate-600">{selectedRecord.symptoms || 'Not recorded'}</p>
              </div>
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Diagnosis</h4>
                <p className="text-slate-600">{selectedRecord.diagnosis || 'Not recorded'}</p>
              </div>
            </div>

            {/* Prescription */}
            {selectedRecord.prescription?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-3">Prescription</h4>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Medicine</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Dosage</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Duration</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedRecord.prescription.map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-medium">{item.medicine}</td>
                        <td className="px-4 py-2">{item.dosage}</td>
                        <td className="px-4 py-2">{item.duration}</td>
                        <td className="px-4 py-2 text-slate-500">{item.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Follow-up */}
            {selectedRecord.followUpDate && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Follow-up Date</h4>
                <p className="text-slate-600">
                  {new Date(selectedRecord.followUpDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}

            {/* Notes */}
            {selectedRecord.notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Notes</h4>
                <p className="text-slate-600">{selectedRecord.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OPDRecords;
