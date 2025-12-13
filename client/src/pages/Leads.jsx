import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Leads = () => {
    const [leads, setLeads] = useState([]);
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);

    const [filters, setFilters] = useState({
        status: '',
        source: '',
        assignedTo: '',
        search: ''
    });

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        source: '',
        status: 'NEW',
        score: 0,
        notes: '',
        assignedTo: ''
    });

    useEffect(() => {
        fetchLeads();
        fetchUsers();
        fetchStats();
    }, [filters]);

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.source) params.append('source', filters.source);
            if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
            if (filters.search) params.append('search', filters.search);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/leads?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setLeads(response.data);
        } catch (error) {
            console.error('Fetch leads error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/auth/users`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(response.data || []);
        } catch (error) {
            console.error('Fetch users error:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/leads/stats/overview`,
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
            if (editingLead) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/leads/${editingLead.id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/leads`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setShowModal(false);
            setEditingLead(null);
            resetForm();
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Save lead error:', error);
            alert(error.response?.data?.error || 'Failed to save lead');
        }
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setFormData({
            name: lead.name,
            email: lead.email || '',
            phone: lead.phone || '',
            company: lead.company || '',
            source: lead.source || '',
            status: lead.status,
            score: lead.score,
            notes: lead.notes || '',
            assignedTo: lead.assignedTo || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/leads/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Delete lead error:', error);
        }
    };

    const handleConvert = async (id) => {
        if (!confirm('Convert this lead to a client?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/leads/${id}/convert`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert(`Lead converted to client: ${response.data.client.name}`);
            fetchLeads();
            fetchStats();
        } catch (error) {
            console.error('Convert lead error:', error);
            alert(error.response?.data?.error || 'Failed to convert lead');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
            source: '',
            status: 'NEW',
            score: 0,
            notes: '',
            assignedTo: ''
        });
    };

    const statusColors = {
        NEW: '#3b82f6',
        CONTACTED: '#8b5cf6',
        QUALIFIED: '#f59e0b',
        PROPOSAL: '#ec4899',
        WON: '#10b981',
        LOST: '#ef4444'
    };

    const sourceOptions = ['WEBSITE', 'REFERRAL', 'SOCIAL', 'COLD_CALL', 'ADVERTISING', 'OTHER'];
    const statusOptions = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Lead Management</h1>
                    <p style={{ color: '#666' }}>Track and convert leads to clients</p>
                </div>
                <button
                    onClick={() => { setEditingLead(null); resetForm(); setShowModal(true); }}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                    + Add Lead
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Leads</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{stats.total}</div>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Average Score</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.averageScore.toFixed(0)}</div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Search leads..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', minWidth: '200px' }}
                />
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Statuses</option>
                    {statusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>
                <select
                    value={filters.source}
                    onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Sources</option>
                    {sourceOptions.map(source => (
                        <option key={source} value={source}>{source}</option>
                    ))}
                </select>
            </div>

            {/* Leads Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading...</div>
                ) : leads.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No leads found</div>
                ) : (
                    leads.map(lead => (
                        <div key={lead.id} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ marginBottom: '0.25rem' }}>{lead.name}</h3>
                                    {lead.company && <div style={{ fontSize: '0.875rem', color: '#666' }}>{lead.company}</div>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        backgroundColor: statusColors[lead.status] + '20',
                                        color: statusColors[lead.status],
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                    }}>
                                        {lead.status}
                                    </span>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        backgroundColor: '#6366f1',
                                        color: 'white',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.875rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {lead.score}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#666' }}>
                                {lead.email && <div>📧 {lead.email}</div>}
                                {lead.phone && <div>📞 {lead.phone}</div>}
                                {lead.source && <div>📍 Source: {lead.source}</div>}
                                {lead.assignee && <div>👤 Assigned: {lead.assignee.name}</div>}
                            </div>

                            {lead.notes && (
                                <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px', fontSize: '0.875rem', marginBottom: '1rem' }}>
                                    {lead.notes}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.875rem' }}>
                                <button
                                    onClick={() => handleEdit(lead)}
                                    style={{ flex: 1, padding: '0.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Edit
                                </button>
                                {lead.status !== 'WON' && (
                                    <button
                                        onClick={() => handleConvert(lead.id)}
                                        style={{ flex: 1, padding: '0.5rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Convert
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(lead.id)}
                                    style={{ padding: '0.5rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Delete
                                </button>
                            </div>

                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.75rem' }}>
                                Added {format(new Date(lead.createdAt), 'MMM dd, yyyy')}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Company</label>
                                    <input
                                        type="text"
                                        value={formData.company}
                                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Source</label>
                                    <select
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="">Select...</option>
                                        {sourceOptions.map(source => (
                                            <option key={source} value={source}>{source}</option>
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
                                        {statusOptions.map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.score}
                                        onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Assign To</label>
                                <select
                                    value={formData.assignedTo}
                                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">Unassigned</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>{user.name || user.email}</option>
                                    ))}
                                </select>
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

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingLead(null); resetForm(); }}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    {editingLead ? 'Update' : 'Create'} Lead
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leads;
