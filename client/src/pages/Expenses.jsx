import { useState, useEffect } from 'react';
import axios from 'axios';
import FileUpload from '../components/FileUpload';
import AttachmentList from '../components/AttachmentList';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [currentExpense, setCurrentExpense] = useState(null);
    const [filters, setFilters] = useState({
        category: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: '',
        vendor: '',
        notes: '',
        status: 'PENDING'
    });

    const [categoryForm, setCategoryForm] = useState({
        name: '',
        color: '#6366f1'
    });

    useEffect(() => {
        fetchExpenses();
        fetchCategories();
        fetchStats();
    }, [filters]);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/expenses?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setExpenses(response.data);
        } catch (error) {
            console.error('Fetch expenses error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/expense-categories`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setCategories(response.data);
        } catch (error) {
            console.error('Fetch categories error:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/expenses/stats?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStats(response.data);
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (currentExpense) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/expenses/${currentExpense.id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/expenses`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setShowModal(false);
            resetForm();
            fetchExpenses();
            fetchStats();
        } catch (error) {
            console.error('Save expense error:', error);
            alert(error.response?.data?.error || 'Failed to save expense');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/expenses/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchExpenses();
            fetchStats();
        } catch (error) {
            console.error('Delete expense error:', error);
        }
    };

    const handleCategorySubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/expense-categories`,
                categoryForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowCategoryModal(false);
            setCategoryForm({ name: '', color: '#6366f1' });
            fetchCategories();
        } catch (error) {
            console.error('Save category error:', error);
            alert(error.response?.data?.error || 'Failed to save category');
        }
    };

    const openEditModal = (expense) => {
        setCurrentExpense(expense);
        setFormData({
            description: expense.description,
            amount: expense.amount,
            date: new Date(expense.date).toISOString().split('T')[0],
            category: expense.category,
            vendor: expense.vendor || '',
            notes: expense.notes || '',
            status: expense.status
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setCurrentExpense(null);
        setFormData({
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: '',
            vendor: '',
            notes: '',
            status: 'PENDING'
        });
    };

    return (
        <div className="expenses-page" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Expense Tracking</h1>
                <p style={{ color: '#666' }}>Track and manage your business expenses</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Expenses</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                            ${stats.totalAmount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                            {stats.totalCount} expenses
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="Start Date"
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="End Date"
                />

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Manage Categories
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Add Expense
                    </button>
                </div>
            </div>

            {/* Expenses Table */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Category</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Vendor</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td>
                            </tr>
                        ) : expenses.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No expenses found</td>
                            </tr>
                        ) : (
                            expenses.map((expense) => (
                                <tr key={expense.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(expense.date).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>{expense.description}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ padding: '0.25rem 0.5rem', backgroundColor: '#e0e7ff', color: '#4338ca', borderRadius: '4px', fontSize: '0.875rem' }}>
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>{expense.vendor || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', color: '#ef4444' }}>
                                        ${expense.amount.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: expense.status === 'APPROVED' ? '#d1fae5' : expense.status === 'REJECTED' ? '#fee2e2' : '#fef3c7',
                                            color: expense.status === 'APPROVED' ? '#065f46' : expense.status === 'REJECTED' ? '#991b1b' : '#92400e',
                                            borderRadius: '4px',
                                            fontSize: '0.875rem'
                                        }}>
                                            {expense.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => openEditModal(expense)}
                                            style={{ marginRight: '0.5rem', padding: '0.25rem 0.75rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense.id)}
                                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Expense Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{currentExpense ? 'Edit Expense' : 'Add Expense'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description *</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Amount *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Date *</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Category *</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Vendor</label>
                                <input
                                    type="text"
                                    value={formData.vendor}
                                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            {currentExpense && (
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Receipt</label>
                                    <FileUpload
                                        entityType="EXPENSE"
                                        entityId={currentExpense.id}
                                        onUploadComplete={() => { }}
                                    />
                                    <div style={{ marginTop: '1rem' }}>
                                        <AttachmentList entityType="EXPENSE" entityId={currentExpense.id} />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); resetForm(); }}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    {currentExpense ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Category Modal */}
            {showCategoryModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '400px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add Category</h2>
                        <form onSubmit={handleCategorySubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name *</label>
                                <input
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Color</label>
                                <input
                                    type="color"
                                    value={categoryForm.color}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', height: '40px' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Existing Categories</h3>
                                <div style={{ maxHeight: '150px', overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '0.5rem' }}>
                                    {categories.map(cat => (
                                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem' }}>
                                            <div style={{ width: '20px', height: '20px', backgroundColor: cat.color, borderRadius: '4px' }}></div>
                                            <span>{cat.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowCategoryModal(false); setCategoryForm({ name: '', color: '#6366f1' }); }}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Close
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Add Category
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
