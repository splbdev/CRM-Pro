import { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ entityType, entityId, onUploadComplete }) => {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB');
            return;
        }

        setError('');
        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('entityType', entityType);
            formData.append('entityId', entityId);

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/attachments`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (onUploadComplete) {
                onUploadComplete(response.data);
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="file-upload">
            <form
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onSubmit={(e) => e.preventDefault()}
            >
                <input
                    type="file"
                    id="file-upload-input"
                    onChange={handleChange}
                    style={{ display: 'none' }}
                />
                <label
                    htmlFor="file-upload-input"
                    className={`file-upload-label ${dragActive ? 'drag-active' : ''}`}
                    style={{
                        display: 'block',
                        padding: '2rem',
                        border: '2px dashed #ccc',
                        borderRadius: '8px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        backgroundColor: dragActive ? '#f0f0f0' : '#fafafa',
                        transition: 'all 0.3s ease'
                    }}
                >
                    {uploading ? (
                        <div>
                            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                            <p>Uploading...</p>
                        </div>
                    ) : (
                        <div>
                            <svg
                                width="48"
                                height="48"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{ margin: '0 auto 1rem', display: 'block', color: '#6366f1' }}
                            >
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <p style={{ marginBottom: '0.5rem', fontWeight: '500' }}>
                                Drag and drop file here, or click to select
                            </p>
                            <p style={{ fontSize: '0.875rem', color: '#666' }}>
                                Max file size: 10MB
                            </p>
                        </div>
                    )}
                </label>
            </form>
            {error && (
                <div style={{ color: '#ef4444', marginTop: '0.5rem', fontSize: '0.875rem' }}>
                    {error}
                </div>
            )}
        </div>
    );
};

export default FileUpload;
