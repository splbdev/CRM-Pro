import { useState, useEffect } from 'react';
import { templates } from '../api';
import { FiPlus, FiEdit2, FiTrash2, FiStar, FiEye, FiX, FiUpload, FiLayout, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

const TEMPLATE_TYPES = ['INVOICE', 'ESTIMATE', 'EMAIL', 'SMS', 'WHATSAPP', 'PROPOSAL'];

// Sample data for preview
const SAMPLE_DATA = {
    invoice_number: 'INV-2024-001',
    client_name: 'Acme Corporation',
    client_email: 'billing@acme.com',
    date: 'Dec 12, 2024',
    due_date: 'Jan 12, 2025',
    items: `<tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px;">Website Development</td><td style="padding: 12px; text-align: right;">1</td><td style="padding: 12px; text-align: right;">$2,500.00</td><td style="padding: 12px; text-align: right;">$2,500.00</td></tr>
<tr style="border-bottom: 1px solid #eee;"><td style="padding: 12px;">Logo Design</td><td style="padding: 12px; text-align: right;">1</td><td style="padding: 12px; text-align: right;">$500.00</td><td style="padding: 12px; text-align: right;">$500.00</td></tr>`,
    total: '$3,000.00'
};

export default function Templates() {
    const [templateList, setTemplateList] = useState([]);
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showPresetGallery, setShowPresetGallery] = useState(false);
    const [editing, setEditing] = useState(null);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    useEffect(() => { loadData(); loadPresets(); }, [activeType]);

    const loadData = async () => {
        try {
            const res = await templates.getAll(activeType || undefined);
            setTemplateList(res.data);
        } catch (error) {
            toast.error('Failed to load');
        } finally {
            setLoading(false);
        }
    };

    const loadPresets = async () => {
        try {
            const res = await templates.getPresets();
            setPresets(res.data);
        } catch (error) {
            console.error('Failed to load presets', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this template?')) return;
        try {
            await templates.delete(id);
            toast.success('Deleted');
            loadData();
        } catch (error) {
            toast.error('Failed');
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (editing) {
                await templates.update(editing.id, data);
            } else {
                await templates.create(data);
            }
            toast.success('Saved');
            setShowModal(false);
            setEditing(null);
            loadData();
        } catch (error) {
            toast.error('Failed');
        }
    };

    const handleCreateFromPreset = async (presetId, type) => {
        try {
            await templates.createFromPreset({
                presetId,
                type: type || 'INVOICE',
                name: `${presets.find(p => p.id === presetId)?.name || 'New'} Template`
            });
            toast.success('Template created from preset');
            setShowPresetGallery(false);
            loadData();
        } catch (error) {
            toast.error('Failed to create from preset');
        }
    };

    const getCategoryBadge = (category) => {
        const colors = {
            MODERN: 'primary',
            CLEAN: 'success',
            PREMIUM: 'warning',
            CLASSIC: 'info',
            CUSTOM: 'default'
        };
        return colors[category] || 'default';
    };

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Templates</h1>
                    <p className="page-subtitle">Design and manage invoice, estimate, and message templates</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-secondary" onClick={() => setShowPresetGallery(true)}>
                        <FiLayout /> Browse Presets
                    </button>
                    <button className="btn btn-primary" onClick={() => { setEditing(null); setShowModal(true); }}>
                        <FiPlus /> New Template
                    </button>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button className={`btn btn-sm ${!activeType ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveType('')}>All</button>
                        {TEMPLATE_TYPES.map(t => (
                            <button key={t} className={`btn btn-sm ${activeType === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveType(t)}>{t}</button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : templateList.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Style</th>
                                    <th>Default</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {templateList.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {t.logoUrl && <img src={t.logoUrl} alt="" style={{ height: 24, width: 24, objectFit: 'contain', borderRadius: 4 }} />}
                                                <strong>{t.name}</strong>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-info">{t.type}</span></td>
                                        <td><span className={`badge badge-${getCategoryBadge(t.category)}`}>{t.category || 'CUSTOM'}</span></td>
                                        <td>{t.isDefault && <FiStar color="var(--warning)" />}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 4 }}>
                                                <button className="btn btn-sm btn-secondary" onClick={() => setPreviewTemplate(t)} title="Preview"><FiEye /></button>
                                                <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(t); setShowModal(true); }}><FiEdit2 /></button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(t.id)}><FiTrash2 /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state">
                        <FiLayout style={{ fontSize: 48, opacity: 0.3, marginBottom: 16 }} />
                        <p>No templates found</p>
                        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowPresetGallery(true)}>
                            <FiLayout /> Browse Presets
                        </button>
                    </div>
                )}
            </div>

            {showModal && (
                <TemplateEditorModal
                    template={editing}
                    presets={presets}
                    onClose={() => { setShowModal(false); setEditing(null); }}
                    onSubmit={handleSubmit}
                />
            )}

            {showPresetGallery && (
                <PresetGalleryModal
                    presets={presets}
                    onClose={() => setShowPresetGallery(false)}
                    onSelect={handleCreateFromPreset}
                />
            )}

            {previewTemplate && (
                <TemplatePreviewModal
                    template={previewTemplate}
                    onClose={() => setPreviewTemplate(null)}
                />
            )}
        </div>
    );
}

function PresetGalleryModal({ presets, onClose, onSelect }) {
    const [selectedType, setSelectedType] = useState('INVOICE');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 900, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Template Presets</h3>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}><FiX /></button>
                </div>
                <div className="modal-body">
                    <div className="form-group" style={{ marginBottom: 24 }}>
                        <label className="form-label">Create template for:</label>
                        <select className="form-input" value={selectedType} onChange={e => setSelectedType(e.target.value)} style={{ maxWidth: 200 }}>
                            {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
                        {presets.map(preset => (
                            <div
                                key={preset.id}
                                style={{
                                    border: '1px solid var(--border)',
                                    borderRadius: 12,
                                    overflow: 'hidden',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                className="preset-card"
                                onClick={() => onSelect(preset.id, selectedType)}
                            >
                                <div style={{
                                    height: 120,
                                    background: preset.style?.headerBg || '#1a1a2e',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: preset.style?.headerColor || '#fff',
                                    fontSize: 24,
                                    fontWeight: 600
                                }}>
                                    {preset.name}
                                </div>
                                <div style={{ padding: 16 }}>
                                    <h4 style={{ margin: '0 0 8px' }}>{preset.name}</h4>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>{preset.description}</p>
                                    <button className="btn btn-sm btn-primary" style={{ marginTop: 12, width: '100%' }}>
                                        <FiCheck /> Use This Preset
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TemplatePreviewModal({ template, onClose }) {
    const renderContent = (content) => {
        if (!content) return '<p style="color: #999; text-align: center;">No content</p>';

        let rendered = content;
        Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
            rendered = rendered.replace(new RegExp(`{{#if logo}}`, 'g'), template.logoUrl ? '' : '<!--');
            rendered = rendered.replace(new RegExp(`{{/if}}`, 'g'), template.logoUrl ? '' : '-->');
            rendered = rendered.replace(new RegExp(`{{logo}}`, 'g'), template.logoUrl || '');
        });
        return rendered;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 800, maxHeight: '90vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">Preview: {template.name}</h3>
                    <button className="btn btn-icon btn-secondary" onClick={onClose}><FiX /></button>
                </div>
                <div className="modal-body" style={{ padding: 0 }}>
                    <div style={{ background: '#f5f5f5', padding: 24 }}>
                        <div
                            style={{ background: '#fff', maxWidth: 600, margin: '0 auto', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            dangerouslySetInnerHTML={{ __html: renderContent(template.content) }}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <span className={`badge badge-${template.category === 'CUSTOM' ? 'default' : 'primary'}`} style={{ marginRight: 'auto' }}>
                        {template.category || 'CUSTOM'}
                    </span>
                    <button className="btn btn-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}

function TemplateEditorModal({ template, presets, onClose, onSubmit }) {
    const [name, setName] = useState(template?.name || '');
    const [type, setType] = useState(template?.type || 'INVOICE');
    const [content, setContent] = useState(template?.content || '');
    const [style, setStyle] = useState(template?.style || {
        headerBg: '#1a1a2e',
        headerColor: '#ffffff',
        accentColor: '#0ea5e9',
        bodyBg: '#ffffff',
        bodyColor: '#1f2937'
    });
    const [category, setCategory] = useState(template?.category || 'CUSTOM');
    const [logoUrl, setLogoUrl] = useState(template?.logoUrl || '');
    const [isDefault, setIsDefault] = useState(template?.isDefault || false);
    const [showPreview, setShowPreview] = useState(true);

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLogoUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const applyPreset = (presetId) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setStyle(preset.style);
            setCategory(presetId);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ name, type, content, style, category, logoUrl, isDefault });
    };

    const renderPreview = () => {
        if (!content) return '<p style="color: #999; text-align: center; padding: 40px;">Start editing to see preview</p>';

        let rendered = content;
        Object.entries(SAMPLE_DATA).forEach(([key, value]) => {
            rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
            rendered = rendered.replace(new RegExp(`{{#if logo}}`, 'g'), logoUrl ? '' : '<!--');
            rendered = rendered.replace(new RegExp(`{{/if}}`, 'g'), logoUrl ? '' : '-->');
            rendered = rendered.replace(new RegExp(`{{logo}}`, 'g'), logoUrl || '');
        });
        return rendered;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: 1100, maxHeight: '95vh', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{template ? 'Edit' : 'New'} Template</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            className={`btn btn-sm ${showPreview ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setShowPreview(!showPreview)}
                        >
                            <FiEye /> {showPreview ? 'Hide Preview' : 'Show Preview'}
                        </button>
                        <button className="btn btn-icon btn-secondary" onClick={onClose}><FiX /></button>
                    </div>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ display: 'flex', gap: 24, padding: 24, maxHeight: 'calc(95vh - 140px)', overflow: 'auto' }}>
                        {/* Editor Panel */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="grid grid-2" style={{ marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="form-label">Name *</label>
                                    <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select className="form-input" value={type} onChange={e => setType(e.target.value)}>
                                        {TEMPLATE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Apply Preset Style</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {presets.map(p => (
                                        <button
                                            key={p.id}
                                            type="button"
                                            className={`btn btn-sm ${category === p.id ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => applyPreset(p.id)}
                                            style={{
                                                background: category === p.id ? p.style?.accentColor : undefined,
                                                borderColor: p.style?.accentColor
                                            }}
                                        >
                                            {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Logo</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    {logoUrl && (
                                        <img src={logoUrl} alt="Logo" style={{ height: 40, maxWidth: 120, objectFit: 'contain', borderRadius: 4, border: '1px solid var(--border)' }} />
                                    )}
                                    <label className="btn btn-sm btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                                        <FiUpload /> Upload Logo
                                        <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                                    </label>
                                    {logoUrl && (
                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => setLogoUrl('')}>
                                            <FiX /> Remove
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 16 }}>
                                <label className="form-label">Design Colors</label>
                                <div style={{ display: 'flex', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Header BG</label>
                                        <input
                                            type="color"
                                            value={style.headerBg?.startsWith('#') ? style.headerBg : '#1a1a2e'}
                                            onChange={e => setStyle({ ...style, headerBg: e.target.value })}
                                            style={{ display: 'block', width: 50, height: 30, border: 'none', cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Accent</label>
                                        <input
                                            type="color"
                                            value={style.accentColor || '#0ea5e9'}
                                            onChange={e => setStyle({ ...style, accentColor: e.target.value })}
                                            style={{ display: 'block', width: 50, height: 30, border: 'none', cursor: 'pointer' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Body BG</label>
                                        <input
                                            type="color"
                                            value={style.bodyBg || '#ffffff'}
                                            onChange={e => setStyle({ ...style, bodyBg: e.target.value })}
                                            style={{ display: 'block', width: 50, height: 30, border: 'none', cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Template Content (HTML)</label>
                                <textarea
                                    className="form-input"
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    rows={12}
                                    placeholder="Use {{client_name}}, {{invoice_number}}, {{date}}, {{due_date}}, {{items}}, {{total}}, {{logo}} for variables"
                                    style={{ fontFamily: 'monospace', fontSize: 13 }}
                                />
                            </div>

                            <div className="form-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
                                    Set as default for {type}
                                </label>
                            </div>
                        </div>

                        {/* Live Preview Panel */}
                        {showPreview && (
                            <div style={{ width: 400, flexShrink: 0, background: '#f5f5f5', borderRadius: 8, padding: 16, overflow: 'auto' }}>
                                <h4 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)' }}>Live Preview</h4>
                                <div
                                    style={{ background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transform: 'scale(0.8)', transformOrigin: 'top left', width: '125%' }}
                                    dangerouslySetInnerHTML={{ __html: renderPreview() }}
                                />
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{template ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
