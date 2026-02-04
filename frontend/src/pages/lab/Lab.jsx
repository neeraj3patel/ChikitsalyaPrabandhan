/**
 * Lab Page
 * Laboratory tests management
 */

import { useState, useEffect } from 'react';
import { labAPI, patientsAPI, doctorsAPI } from '../../services/api';
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
  FiUpload,
  FiDownload
} from 'react-icons/fi';

const Lab = () => {
  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    testType: '',
    priority: 'NORMAL',
    notes: ''
  });
  const [resultData, setResultData] = useState({
    result: '',
    remarks: '',
    attachments: []
  });

  useEffect(() => {
    fetchTests();
    fetchPatients();
    fetchDoctors();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await labAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      setTests(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch lab tests', error);
      toast.error('Failed to fetch lab tests');
    } finally {
      setLoading(false);
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

  const fetchDoctors = async () => {
    try {
      const response = await doctorsAPI.getAll({ limit: 100 });
      setDoctors(response.data.data);
    } catch (error) {
      console.error('Failed to fetch doctors');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResultChange = (e) => {
    setResultData({ ...resultData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      if (selectedTest) {
        await labAPI.update(selectedTest._id, formData);
        toast.success('Lab test updated successfully');
      } else {
        await labAPI.create(formData);
        toast.success('Lab test ordered successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleResultSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await labAPI.updateResult(selectedTest._id, resultData);
      toast.success('Test result updated successfully');
      setIsResultModalOpen(false);
      resetResultForm();
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update result');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusUpdate = async (test, status) => {
    try {
      await labAPI.updateStatus(test._id, { status });
      toast.success(`Test status updated to ${status}`);
      fetchTests();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (test) => {
    setSelectedTest(test);
    setFormData({
      patientId: test.patientId?._id || '',
      doctorId: test.doctorId?._id || '',
      testType: test.testType || '',
      priority: test.priority || 'NORMAL',
      notes: test.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleView = (test) => {
    setSelectedTest(test);
    setIsViewModalOpen(true);
  };

  const openResultModal = (test) => {
    setSelectedTest(test);
    setResultData({
      result: test.result || '',
      remarks: test.remarks || '',
      attachments: []
    });
    setIsResultModalOpen(true);
  };

  const resetForm = () => {
    setSelectedTest(null);
    setFormData({
      patientId: '',
      doctorId: '',
      testType: '',
      priority: 'NORMAL',
      notes: ''
    });
  };

  const resetResultForm = () => {
    setSelectedTest(null);
    setResultData({
      result: '',
      remarks: '',
      attachments: []
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      SAMPLE_COLLECTED: 'info',
      IN_PROGRESS: 'info',
      COMPLETED: 'success',
      CANCELLED: 'danger'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      NORMAL: 'secondary',
      URGENT: 'warning',
      CRITICAL: 'danger'
    };
    return <Badge variant={variants[priority] || 'secondary'}>{priority}</Badge>;
  };

  const columns = [
    {
      key: 'testId',
      label: 'Test ID',
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
      key: 'testType',
      label: 'Test Type',
      render: (value) => value
    },
    {
      key: 'doctor',
      label: 'Referred By',
      render: (_, row) => row.doctorId?.userId?.name ? `Dr. ${row.doctorId.userId.name}` : '-'
    },
    {
      key: 'priority',
      label: 'Priority',
      render: (value) => getPriorityBadge(value)
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
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
          {row.status === 'PENDING' && (
            <button
              onClick={() => handleEdit(row)}
              className="p-1 text-slate-500 hover:text-yellow-600"
              title="Edit"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
          )}
          {(row.status === 'IN_PROGRESS' || row.status === 'SAMPLE_COLLECTED') && (
            <button
              onClick={() => openResultModal(row)}
              className="p-1 text-slate-500 hover:text-green-600"
              title="Add Result"
            >
              <FiUpload className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const testTypes = [
    'Blood Test - CBC',
    'Blood Test - Lipid Profile',
    'Blood Test - Liver Function',
    'Blood Test - Kidney Function',
    'Blood Test - Thyroid',
    'Blood Test - Diabetes (HbA1c)',
    'Urine Test',
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'ECG',
    'EEG',
    'Biopsy',
    'COVID-19 Test',
    'Other'
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'SAMPLE_COLLECTED', label: 'Sample Collected' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const priorityOptions = [
    { value: 'NORMAL', label: 'Normal' },
    { value: 'URGENT', label: 'Urgent' },
    { value: 'CRITICAL', label: 'Critical' }
  ];

  if (loading && tests.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Laboratory</h1>
          <p className="text-slate-500">Manage lab tests and results</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          New Test Order
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
        data={tests}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search lab tests..."
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
      />

      {/* Order Test Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={selectedTest ? 'Edit Lab Test' : 'Order New Lab Test'}
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
            label="Referring Doctor"
            name="doctorId"
            value={formData.doctorId}
            onChange={handleChange}
            options={doctors.map((d) => ({
              value: d._id,
              label: `Dr. ${d.userId?.name} - ${d.specialization}`
            }))}
          />

          <Select
            label="Test Type"
            name="testType"
            value={formData.testType}
            onChange={handleChange}
            options={testTypes.map((t) => ({ value: t, label: t }))}
            required
          />

          <Select
            label="Priority"
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            options={priorityOptions}
          />

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
              placeholder="Clinical notes, special instructions..."
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
              {selectedTest ? 'Update' : 'Order'} Test
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Result Modal */}
      <Modal
        isOpen={isResultModalOpen}
        onClose={() => {
          setIsResultModalOpen(false);
          resetResultForm();
        }}
        title="Add Test Result"
        size="lg"
      >
        <form onSubmit={handleResultSubmit} className="space-y-4">
          {selectedTest && (
            <div className="p-4 bg-slate-50 rounded-lg mb-4">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium text-slate-800">
                    {selectedTest.patientId?.userId?.name}
                  </p>
                  <p className="text-sm text-slate-500">{selectedTest.testId}</p>
                </div>
                <Badge variant="info">{selectedTest.testType}</Badge>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Test Result
            </label>
            <textarea
              name="result"
              value={resultData.result}
              onChange={handleResultChange}
              rows={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter detailed test results..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Remarks / Interpretation
            </label>
            <textarea
              name="remarks"
              value={resultData.remarks}
              onChange={handleResultChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Doctor's remarks or interpretation..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsResultModalOpen(false);
                resetResultForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Submit Result
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Lab Test Details"
        size="lg"
      >
        {selectedTest && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-sm text-slate-500">{selectedTest.testId}</span>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedTest.status)}
                  {getPriorityBadge(selectedTest.priority)}
                </div>
              </div>
              {selectedTest.status === 'COMPLETED' && (
                <Button variant="outline" size="sm" icon={FiDownload}>
                  Download
                </Button>
              )}
            </div>

            {/* Patient & Doctor */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 mb-1">Patient</p>
                <p className="font-semibold text-slate-800">
                  {selectedTest.patientId?.userId?.name}
                </p>
                <p className="text-sm text-slate-500">{selectedTest.patientId?.patientId}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 mb-1">Referred By</p>
                <p className="font-semibold text-slate-800">
                  {selectedTest.doctorId?.userId?.name ? `Dr. ${selectedTest.doctorId.userId.name}` : 'Self'}
                </p>
                <p className="text-sm text-slate-500">{selectedTest.doctorId?.specialization || '-'}</p>
              </div>
            </div>

            {/* Test Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Test Type</p>
                <p className="font-medium">{selectedTest.testType}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">Ordered Date</p>
                <p className="font-medium">
                  {new Date(selectedTest.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Notes */}
            {selectedTest.notes && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Clinical Notes</h4>
                <p className="text-slate-600">{selectedTest.notes}</p>
              </div>
            )}

            {/* Result */}
            {selectedTest.result && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Test Result</h4>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-slate-700 font-mono">
                    {selectedTest.result}
                  </pre>
                </div>
              </div>
            )}

            {/* Remarks */}
            {selectedTest.remarks && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-2">Remarks</h4>
                <p className="text-slate-600">{selectedTest.remarks}</p>
              </div>
            )}

            {/* Status Actions */}
            {selectedTest.status !== 'COMPLETED' && selectedTest.status !== 'CANCELLED' && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-3">Update Status</h4>
                <div className="flex gap-2">
                  {selectedTest.status === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleStatusUpdate(selectedTest, 'SAMPLE_COLLECTED');
                        setIsViewModalOpen(false);
                      }}
                    >
                      Mark Sample Collected
                    </Button>
                  )}
                  {selectedTest.status === 'SAMPLE_COLLECTED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleStatusUpdate(selectedTest, 'IN_PROGRESS');
                        setIsViewModalOpen(false);
                      }}
                    >
                      Start Processing
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Lab;
