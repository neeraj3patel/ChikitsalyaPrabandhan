/**
 * Billing Page
 * Invoice and payment management
 */

import { useState, useEffect } from 'react';
import { billingAPI, patientsAPI } from '../../services/api';
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
  FiEye,
  FiDollarSign,
  FiPrinter,
  FiDownload,
  FiTrash2
} from 'react-icons/fi';

const Billing = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
    discount: 0,
    tax: 0,
    notes: ''
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'CASH',
    transactionId: '',
    notes: ''
  });

  useEffect(() => {
    fetchInvoices();
    fetchPatients();
  }, [pagination.page, searchTerm, statusFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await billingAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm,
        status: statusFilter
      });
      setInvoices(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch invoices', error);
      toast.error('Failed to fetch invoices');
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePaymentChange = (e) => {
    setPaymentData({ ...paymentData, [e.target.name]: e.target.value });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    updated[index][field] = field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || 0 : value;
    setFormData({ ...formData, items: updated });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', quantity: 1, unitPrice: 0 }]
    });
  };

  const removeItem = (index) => {
    const updated = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updated });
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const discount = parseFloat(formData.discount) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const taxAmount = (subtotal - discount) * (tax / 100);
    return subtotal - discount + taxAmount;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const payload = {
        ...formData,
        discount: parseFloat(formData.discount) || 0,
        tax: parseFloat(formData.tax) || 0
      };

      await billingAPI.create(payload);
      toast.success('Invoice created successfully');
      setIsModalOpen(false);
      resetForm();
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      await billingAPI.addPayment(selectedInvoice._id, {
        ...paymentData,
        amount: parseFloat(paymentData.amount)
      });
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      resetPaymentForm();
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    } finally {
      setFormLoading(false);
    }
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setIsViewModalOpen(true);
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      amount: invoice.balanceAmount?.toString() || '',
      paymentMethod: 'CASH',
      transactionId: '',
      notes: ''
    });
    setIsPaymentModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      items: [{ description: '', quantity: 1, unitPrice: 0 }],
      discount: 0,
      tax: 0,
      notes: ''
    });
  };

  const resetPaymentForm = () => {
    setSelectedInvoice(null);
    setPaymentData({
      amount: '',
      paymentMethod: 'CASH',
      transactionId: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      PENDING: 'warning',
      PARTIAL: 'info',
      PAID: 'success',
      CANCELLED: 'danger'
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'invoiceId',
      label: 'Invoice ID',
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
      key: 'invoiceDate',
      label: 'Date',
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'totalAmount',
      label: 'Total',
      render: (value) => <span className="font-medium">₹{value?.toLocaleString()}</span>
    },
    {
      key: 'paidAmount',
      label: 'Paid',
      render: (value) => <span className="text-green-600">₹{value?.toLocaleString()}</span>
    },
    {
      key: 'balanceAmount',
      label: 'Balance',
      render: (value) => (
        <span className={value > 0 ? 'text-red-600 font-medium' : 'text-slate-500'}>
          ₹{value?.toLocaleString()}
        </span>
      )
    },
    {
      key: 'paymentStatus',
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
          {row.paymentStatus !== 'PAID' && row.paymentStatus !== 'CANCELLED' && (
            <button
              onClick={() => openPaymentModal(row)}
              className="p-1 text-slate-500 hover:text-green-600"
              title="Add Payment"
            >
              <FiDollarSign className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PARTIAL', label: 'Partial' },
    { value: 'PAID', label: 'Paid' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const paymentMethods = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'UPI', label: 'UPI' },
    { value: 'NETBANKING', label: 'Net Banking' },
    { value: 'INSURANCE', label: 'Insurance' }
  ];

  if (loading && invoices.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Billing</h1>
          <p className="text-slate-500">Manage invoices and payments</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Create Invoice
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
        data={invoices}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search invoices..."
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
      />

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title="Create New Invoice"
        size="xl"
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

          {/* Invoice Items */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-slate-800">Invoice Items</h3>
              <Button type="button" size="sm" variant="outline" onClick={addItem}>
                Add Item
              </Button>
            </div>
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-20">Qty</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">Unit Price</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 w-28">Amount</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                        placeholder="Description"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                        min="1"
                        required
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 border border-slate-300 rounded"
                        min="0"
                        step="0.01"
                        required
                      />
                    </td>
                    <td className="px-3 py-2 font-medium">
                      ₹{(item.quantity * item.unitPrice).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <Input
              label="Discount (₹)"
              type="number"
              name="discount"
              value={formData.discount}
              onChange={handleChange}
              min="0"
            />
            <Input
              label="Tax (%)"
              type="number"
              name="tax"
              value={formData.tax}
              onChange={handleChange}
              min="0"
              max="100"
            />
          </div>

          {/* Total */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span>₹{calculateTotal().toLocaleString()}</span>
            </div>
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
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Additional notes..."
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
              Create Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          resetPaymentForm();
        }}
        title="Record Payment"
        size="md"
      >
        <form onSubmit={handlePaymentSubmit} className="space-y-4">
          {selectedInvoice && (
            <div className="p-4 bg-slate-50 rounded-lg mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-medium">{selectedInvoice.invoiceId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-slate-500">Total Amount:</span>
                <span className="font-medium">₹{selectedInvoice.totalAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance Due:</span>
                <span className="font-medium text-red-600">₹{selectedInvoice.balanceAmount?.toLocaleString()}</span>
              </div>
            </div>
          )}

          <Input
            label="Payment Amount (₹)"
            type="number"
            name="amount"
            value={paymentData.amount}
            onChange={handlePaymentChange}
            max={selectedInvoice?.balanceAmount}
            min="0.01"
            step="0.01"
            required
          />

          <Select
            label="Payment Method"
            name="paymentMethod"
            value={paymentData.paymentMethod}
            onChange={handlePaymentChange}
            options={paymentMethods}
          />

          <Input
            label="Transaction ID"
            name="transactionId"
            value={paymentData.transactionId}
            onChange={handlePaymentChange}
            placeholder="Reference/Transaction number"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={paymentData.notes}
              onChange={handlePaymentChange}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              placeholder="Payment notes..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPaymentModalOpen(false);
                resetPaymentForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={formLoading}>
              Record Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Invoice Details"
        size="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="font-mono text-lg font-semibold">{selectedInvoice.invoiceId}</span>
                <p className="text-sm text-slate-500 mt-1">
                  Date: {new Date(selectedInvoice.invoiceDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                {getStatusBadge(selectedInvoice.paymentStatus)}
                <Button variant="outline" size="sm" icon={FiPrinter}>
                  Print
                </Button>
              </div>
            </div>

            {/* Patient Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 mb-1">Bill To</p>
              <p className="font-semibold text-slate-800">
                {selectedInvoice.patientId?.userId?.name}
              </p>
              <p className="text-sm text-slate-500">{selectedInvoice.patientId?.patientId}</p>
            </div>

            {/* Items */}
            <div>
              <h4 className="font-medium text-slate-800 mb-3">Items</h4>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-500">Description</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Unit Price</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-slate-500">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoice.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2">{item.description}</td>
                      <td className="px-4 py-2 text-right">{item.quantity}</td>
                      <td className="px-4 py-2 text-right">₹{item.unitPrice}</td>
                      <td className="px-4 py-2 text-right font-medium">
                        ₹{(item.quantity * item.unitPrice).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t pt-4">
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subtotal:</span>
                    <span>₹{selectedInvoice.subtotal?.toLocaleString()}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Discount:</span>
                      <span className="text-green-600">-₹{selectedInvoice.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedInvoice.taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax ({selectedInvoice.tax}%):</span>
                      <span>₹{selectedInvoice.taxAmount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>₹{selectedInvoice.totalAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Paid:</span>
                    <span>₹{selectedInvoice.paidAmount?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-red-600 font-semibold">
                    <span>Balance:</span>
                    <span>₹{selectedInvoice.balanceAmount?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History */}
            {selectedInvoice.payments?.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-slate-800 mb-3">Payment History</h4>
                <div className="space-y-2">
                  {selectedInvoice.payments.map((payment, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-medium">₹{payment.amount?.toLocaleString()}</p>
                        <p className="text-sm text-slate-500">
                          {payment.paymentMethod} • {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="success">Paid</Badge>
                    </div>
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

export default Billing;
