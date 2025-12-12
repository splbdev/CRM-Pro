import { useState, useEffect } from 'react';
import axios from 'axios';

const AttachmentList = ({ entityType, entityId }) => {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAttachments();
    }, [entityType, entityId]);

    const fetchAttachments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/attachments/entity/${entityType}/${entityId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setAttachments(response.data);
        } catch (error) {
            console.error('Fetch attachments error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (attachment) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/attachments/${attachment.id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    responseType: 'blob'
                }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', attachment.originalName);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    const handleDelete = async (attachmentId) => {
        if (!confirm('Are you sure you want to delete this file?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/attachments/${attachmentId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setAttachments(attachments.filter(a => a.id !== attachmentId));
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    if (loading) {
        return <div>Loading attachments...</div>;
    }

    if (attachments.length === 0) {
        return <div style={{ color: '#666', fontStyle: 'italic' }}>No attachments</div>;
    }

    return (
        <div className="attachment-list">
            {attachments.map((attachment) => (
                <div
                    key={attachment.id}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        marginBottom: '0.5rem'
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>
                            {attachment.originalName}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>
                            {formatFileSize(attachment.size)} • {new Date(attachment.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={() => handleDownload(attachment)}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Download
                        </button>
                        <button
                            onClick={() => handleDelete(attachment.id)}
                            style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AttachmentList;
