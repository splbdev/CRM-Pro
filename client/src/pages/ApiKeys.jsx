import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ApiKeys = () => {
    const [apiKeys, setApiKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        permissions: ['read'],
        expiresAt: ''
    });

    useEffect(() => {
        fetchApiKeys();
    }, []);

    const fetchApiKeys = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/api-keys`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setApiKeys(response.data);
        } catch (error) {
            console.error('Fetch API keys error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/api-keys`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('API key created successfully');
            setShowModal(false);
            setFormData({ name: '', permissions: ['read'], expiresAt: '' });
            fetchApiKeys();
        } catch (error) {
            console.error('Create API key error:', error);
            toast.error('Failed to create API key');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/api-keys/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('API key deleted');
            fetchApiKeys();
        } catch (error) {
            console.error('Delete API key error:', error);
            toast.error('Failed to delete API key');
        }
    };

    const handleRegenerate = async (id) => {
        if (!confirm('Regenerate this API key? The old key will stop working immediately.')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/api-keys/${id}/regenerate`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('API key regenerated');
            fetchApiKeys();
        } catch (error) {
            console.error('Regenerate API key error:', error);
            toast.error('Failed to regenerate API key');
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('API key copied to clipboard');
    };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>API Keys</h1>
                    <p style={{ color: '#666' }}>Manage API keys for external integrations</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                    + Create API Key
                </button>
            </div>

            <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>
                ) : apiKeys.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
                        No API keys yet. Create one to get started.
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f9fafb' }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Name</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Key</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Permissions</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Last Used</th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Expires</th>
                                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map(key => (
                                <tr key={key.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>{key.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <code style={{ padding: '0.25rem 0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px', fontSize: '0.875rem' }}>
                                                {key.key.substring(0, 20)}...
                                            </code>
                                            <button
                                                onClick={() => copyToClipboard(key.key)}
                                                style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                            {key.permissions.map(perm => (
                                                <span key={perm} style={{ padding: '0.125rem 0.5rem', backgroundColor: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '0.75rem' }}>
                                                    {perm}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                                        {key.lastUsedAt ? format(new Date(key.lastUsedAt), 'MMM dd, yyyy') : 'Never'}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#666' }}>
                                        {key.expiresAt ? format(new Date(key.expiresAt), 'MMM dd, yyyy') : 'Never'}
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                            <button
                                                onClick={() => handleRegenerate(key.id)}
                                                style={{ padding: '0.25rem 0.75rem', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                                            >
                                                Regenerate
                                            </button>
                                            <button
                                                onClick={() => handleDelete(key.id)}
                                                style={{ padding: '0.25rem 0.75rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Create API Key</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Mobile App Integration"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Permissions</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {['read', 'write', 'delete'].map(perm => (
                                        <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input
                                                type="checkbox"
                                                checked={formData.permissions.includes(perm)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData({ ...formData, permissions: [...formData.permissions, perm] });
                                                    } else {
                                                        setFormData({ ...formData, permissions: formData.permissions.filter(p => p !== perm) });
                                                    }
                                                }}
                                            />
                                            <span style={{ textTransform: 'capitalize' }}>{perm}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Expiration Date (Optional)</label>
                                <input
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setFormData({ name: '', permissions: ['read'], expiresAt: '' }); }}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Create Key
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApiKeys;
