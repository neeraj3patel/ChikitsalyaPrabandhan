/**
 * Pharmacy Page
 * Medicine inventory management
 */

import { useState, useEffect } from 'react';
import { pharmacyAPI } from '../../services/api';
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
  FiPackage,
  FiAlertTriangle
} from 'react-icons/fi';

const Pharmacy = () => {
  const [loading, setLoading] = useState(true);
  const [medicines, setMedicines] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: '',
    manufacturer: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    stock: '',
    purchasePrice: '',
    sellingPrice: '',
    minStockLevel: '',
    description: ''
  });

  useEffect(() => {
    fetchMedicines();
  }, [pagination.page, searchTerm, categoryFilter]);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await pharmacyAPI.getAll({
        page: pagination.page,
        limit: 10,
        search: searchTerm,
        category: categoryFilter
      });
      setMedicines(response.data.data || []);
      setPagination({
        page: response.data.currentPage || 1,
        totalPages: response.data.pages || 1,
        total: response.data.total || 0
      });
    } catch (error) {
      console.log('Failed to fetch medicines', error);
      toast.error('Failed to fetch medicines');
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
        stock: parseInt(formData.stock) || 0,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        minStockLevel: parseInt(formData.minStockLevel) || 10
      };

      if (selectedMedicine) {
        await pharmacyAPI.update(selectedMedicine._id, payload);
        toast.success('Medicine updated successfully');
      } else {
        await pharmacyAPI.create(payload);
        toast.success('Medicine added successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchMedicines();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (medicine) => {
    setSelectedMedicine(medicine);
    setFormData({
      name: medicine.name || '',
      genericName: medicine.genericName || '',
      category: medicine.category || '',
      manufacturer: medicine.manufacturer || '',
      batchNumber: medicine.batchNumber || '',
      manufacturingDate: medicine.manufacturingDate ? medicine.manufacturingDate.split('T')[0] : '',
      expiryDate: medicine.expiryDate ? medicine.expiryDate.split('T')[0] : '',
      stock: medicine.stock?.toString() || '',
      purchasePrice: medicine.purchasePrice?.toString() || '',
      sellingPrice: medicine.sellingPrice?.toString() || '',
      minStockLevel: medicine.minStockLevel?.toString() || '',
      description: medicine.description || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (medicine) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await pharmacyAPI.delete(medicine._id);
        toast.success('Medicine deleted successfully');
        fetchMedicines();
      } catch (error) {
        toast.error('Failed to delete medicine');
      }
    }
  };

  const resetForm = () => {
    setSelectedMedicine(null);
    setFormData({
      name: '',
      genericName: '',
      category: '',
      manufacturer: '',
      batchNumber: '',
      manufacturingDate: '',
      expiryDate: '',
      stock: '',
      purchasePrice: '',
      sellingPrice: '',
      minStockLevel: '',
      description: ''
    });
  };

  const getStockStatus = (medicine) => {
    if (medicine.stock <= 0) {
      return <Badge variant="danger">Out of Stock</Badge>;
    }
    if (medicine.stock <= (medicine.minStockLevel || 10)) {
      return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const columns = [
    {
      key: 'medicineId',
      label: 'ID',
      render: (value) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'name',
      label: 'Medicine',
      render: (_, row) => (
        <div>
          <p className="font-medium text-slate-800">{row.name}</p>
          <p className="text-xs text-slate-500">{row.genericName}</p>
        </div>
      )
    },
    {
      key: 'category',
      label: 'Category',
      render: (value) => <Badge variant="info">{value}</Badge>
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          {value <= (row.minStockLevel || 10) && <FiAlertTriangle className="w-4 h-4 text-yellow-500" />}
        </div>
      )
    },
    {
      key: 'sellingPrice',
      label: 'Price',
      render: (value) => `₹${value}`
    },
    {
      key: 'expiryDate',
      label: 'Expiry',
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className={isExpired(value) ? 'text-red-600' : isExpiringSoon(value) ? 'text-yellow-600' : ''}>
            {value ? new Date(value).toLocaleDateString() : '-'}
          </span>
          {isExpired(value) && <Badge variant="danger">Expired</Badge>}
          {isExpiringSoon(value) && !isExpired(value) && <Badge variant="warning">Expiring</Badge>}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (_, row) => getStockStatus(row)
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

  const categoryOptions = [
    { value: '', label: 'All Categories' },
    { value: 'Tablet', label: 'Tablet' },
    { value: 'Capsule', label: 'Capsule' },
    { value: 'Syrup', label: 'Syrup' },
    { value: 'Injection', label: 'Injection' },
    { value: 'Cream', label: 'Cream' },
    { value: 'Drops', label: 'Drops' },
    { value: 'Inhaler', label: 'Inhaler' },
    { value: 'Other', label: 'Other' }
  ];

  // Calculate stats
  const lowStockCount = medicines.filter(m => m.stock <= (m.minStockLevel || 10) && m.stock > 0).length;
  const outOfStockCount = medicines.filter(m => m.stock <= 0).length;
  const expiringCount = medicines.filter(m => isExpiringSoon(m.expiryDate)).length;

  if (loading && medicines.length === 0) {
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
          <h1 className="text-2xl font-bold text-slate-800">Pharmacy</h1>
          <p className="text-slate-500">Manage medicine inventory</p>
        </div>
        <Button
          icon={FiPlus}
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          Add Medicine
        </Button>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lowStockCount > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Low Stock Alert</p>
              <p className="text-sm text-yellow-600">{lowStockCount} items need reorder</p>
            </div>
          </div>
        )}
        {outOfStockCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <FiPackage className="w-6 h-6 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Out of Stock</p>
              <p className="text-sm text-red-600">{outOfStockCount} items out of stock</p>
            </div>
          </div>
        )}
        {expiringCount > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
            <FiAlertTriangle className="w-6 h-6 text-orange-600" />
            <div>
              <p className="font-medium text-orange-800">Expiring Soon</p>
              <p className="text-sm text-orange-600">{expiringCount} items expiring in 30 days</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          options={categoryOptions}
          className="w-48"
        />
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={medicines}
        loading={loading}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search medicines..."
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
        title={selectedMedicine ? 'Edit Medicine' : 'Add New Medicine'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Medicine Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <Input
              label="Generic Name"
              name="genericName"
              value={formData.genericName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions.filter(c => c.value !== '')}
              required
            />
            <Input
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Batch Number"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              required
            />
            <Input
              label="Manufacturing Date"
              type="date"
              name="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleChange}
              required
            />
          </div>

          <Input
            label="Expiry Date"
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Stock Quantity"
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
            />
            <Input
              label="Purchase Price (₹)"
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
            <Input
              label="Selling Price (₹)"
              type="number"
              name="sellingPrice"
              value={formData.sellingPrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
            />
          </div>

          <Input
            label="Min Stock Level"
            type="number"
            name="minStockLevel"
            value={formData.minStockLevel}
            onChange={handleChange}
            min="0"
            placeholder="Minimum stock before reorder alert"
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Usage instructions, side effects, etc."
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
              {selectedMedicine ? 'Update' : 'Add'} Medicine
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Pharmacy;
