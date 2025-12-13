import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { clients } from '../api';
import { FiPlus, FiSearch, FiEdit2, FiTrash2, FiMail, FiPhone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import FileUpload from '../components/FileUpload';

export default function Clients() {
    const [clientList, setClientList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const res = await clients.getAll({ search });
            setClientList(res.data.clients);
        } catch (error) {
            toast.error('Failed to load clients');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        // Debounced search
        setTimeout(() => loadClients(), 300);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this client?')) return;
        try {
            await clients.delete(id);
            toast.success('Client deleted');
            loadClients();
        } catch (error) {
            toast.error('Failed to delete client');
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editingClient) {
                await clients.update(editingClient.id, data);
                toast.success('Client updated');
            } else {
                await clients.create(data);
                toast.success('Client created');
            }
            setShowModal(false);
            setEditingClient(null);
            loadClients();
        } catch (error) {
            toast.error('Failed to save client');
        }
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Clients</h1>
                    <p className="page-subtitle">Manage your client directory</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingClient(null); setShowModal(true); }}>
                    <FiPlus /> Add Client
                </button>
            </div>

            <div className="card">
                <div className="card-header">
                    <div style={{ position: 'relative', width: 300 }}>
                        <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Search clients..."
                            value={search}
                            onChange={handleSearch}
                            style={{ paddingLeft: 40 }}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : clientList.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Email</th>
                                    <th>Phone</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientList.map(client => (
                                    <tr key={client.id}>
                                        <td><Link to={`/clients/${client.id}`}><strong>{client.name}</strong></Link></td>
                                        <td>{client.company || '-'}</td>
                                        <td>
                                            {client.email && (
                                                <a href={`mailto:${client.email}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FiMail size={14} /> {client.email}
                                                </a>
                                            )}
                                        </td>
                                        <td>
                                            {client.phone && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <FiPhone size={14} /> {client.phone}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => { setEditingClient(client); setShowModal(true); }}>
                                                    <FiEdit2 />
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(client.id)}>
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiPlus className="empty-state-icon" />
                        <p>No clients yet. Add your first client!</p>
                    </div>
                )}
            </div>

            {showModal && (
                <ClientModal
                    client={editingClient}
                    onClose={() => { setShowModal(false); setEditingClient(null); }}
                    onSubmit={handleSubmit}
                />
            )}
        </div>
    );
}

function ClientModal({ client, onClose, onSubmit }) {
    const [form, setForm] = useState({
        name: client?.name || '',
        email: client?.email || '',
        phone: client?.phone || '',
        company: client?.company || '',
        address: client?.address || '',
        notes: client?.notes || ''
    });
    const [activeTab, setActiveTab] = useState('details');
    const [attachments, setAttachments] = useState([]);

    useEffect(() => {
        if (client?.id) {
            loadAttachments();
        }
    }, [client]);

    const loadAttachments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/attachments/entity/CLIENT/${client.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await response.json();
            setAttachments(data);
        } catch (error) {
            console.error('Load attachments error:', error);
        }
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    const handleUploadComplete = () => {
        loadAttachments();
        toast.success('File uploaded successfully');
    };

    const handleDeleteAttachment = async (id) => {
        if (!confirm('Delete this file?')) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${import.meta.env.VITE_API_URL}/api/attachments/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('File deleted');
            loadAttachments();
        } catch (error) {
            toast.error('Failed to delete file');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h3 className="modal-title">{client ? 'Edit Client' : 'Add Client'}</h3>
                    <button className="btn btn-sm btn-secondary" onClick={onClose}>×</button>
                </div>

                {/* Tabs */}
                {client && (
                    <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 1.5rem' }}>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setActiveTab('details')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'details' ? '2px solid #6366f1' : '2px solid transparent',
                                    color: activeTab === 'details' ? '#6366f1' : '#666',
                                    fontWeight: activeTab === 'details' ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                Details
                            </button>
                            <button
                                onClick={() => setActiveTab('files')}
                                style={{
                                    padding: '0.75rem 1rem',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderBottom: activeTab === 'files' ? '2px solid #6366f1' : '2px solid transparent',
                                    color: activeTab === 'files' ? '#6366f1' : '#666',
                                    fontWeight: activeTab === 'files' ? '600' : '400',
                                    cursor: 'pointer'
                                }}
                            >
                                Files ({attachments.length})
                            </button>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        {activeTab === 'details' ? (
                            <>
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input type="text" name="name" className="form-input" value={form.name} onChange={handleChange} required />
                                </div>
                                <div className="grid grid-2">
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Phone</label>
                                        <input type="tel" name="phone" className="form-input" value={form.phone} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Company</label>
                                    <input type="text" name="company" className="form-input" value={form.company} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Address</label>
                                    <textarea name="address" className="form-input" value={form.address} onChange={handleChange} rows={2} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes</label>
                                    <textarea name="notes" className="form-input" value={form.notes} onChange={handleChange} rows={3} />
                                </div>
                            </>
                        ) : (
                            <div>
                                <FileUpload
                                    entityType="CLIENT"
                                    entityId={client.id}
                                    onUploadComplete={handleUploadComplete}
                                />
                                <div style={{ marginTop: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: '600', color: '#666' }}>
                                        Attached Files
                                    </h4>
                                    {attachments.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>No files attached</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {attachments.map(file => (
                                                <div key={file.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{file.originalName}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <a
                                                            href={`${import.meta.env.VITE_API_URL}/api/attachments/${file.id}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#6366f1', color: 'white', borderRadius: '4px', textDecoration: 'none', fontSize: '0.875rem' }}
                                                        >
                                                            Download
                                                        </a>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteAttachment(file.id)}
                                                            style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        {activeTab === 'details' && (
                            <button type="submit" className="btn btn-primary">{client ? 'Update' : 'Create'}</button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
}
