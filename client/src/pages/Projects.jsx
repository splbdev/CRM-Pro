import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [showMilestoneModal, setShowMilestoneModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        description: '',
        status: 'ACTIVE',
        budget: '',
        startDate: '',
        endDate: ''
    });

    const [milestoneForm, setMilestoneForm] = useState({
        name: '',
        dueDate: ''
    });

    useEffect(() => {
        fetchProjects();
        fetchClients();
        fetchStats();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/projects`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setProjects(response.data);
        } catch (error) {
            console.error('Fetch projects error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchClients = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/clients`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setClients(response.data);
        } catch (error) {
            console.error('Fetch clients error:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/projects/stats/overview`,
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
            if (editingProject) {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/api/projects/${editingProject.id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `${import.meta.env.VITE_API_URL}/api/projects`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }
            setShowModal(false);
            setEditingProject(null);
            resetForm();
            fetchProjects();
            fetchStats();
        } catch (error) {
            console.error('Save project error:', error);
            alert(error.response?.data?.error || 'Failed to save project');
        }
    };

    const handleEdit = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name,
            clientId: project.client.id,
            description: project.description || '',
            status: project.status,
            budget: project.budget || '',
            startDate: project.startDate ? format(new Date(project.startDate), 'yyyy-MM-dd') : '',
            endDate: project.endDate ? format(new Date(project.endDate), 'yyyy-MM-dd') : ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/projects/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProjects();
            fetchStats();
        } catch (error) {
            console.error('Delete project error:', error);
        }
    };

    const handleAddMilestone = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/projects/${selectedProject.id}/milestones`,
                milestoneForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowMilestoneModal(false);
            setMilestoneForm({ name: '', dueDate: '' });
            fetchProjects();
        } catch (error) {
            console.error('Add milestone error:', error);
            alert(error.response?.data?.error || 'Failed to add milestone');
        }
    };

    const handleToggleMilestone = async (projectId, milestoneId, completed) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/milestones/${milestoneId}`,
                { completed: !completed },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchProjects();
        } catch (error) {
            console.error('Toggle milestone error:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            clientId: '',
            description: '',
            status: 'ACTIVE',
            budget: '',
            startDate: '',
            endDate: ''
        });
    };

    const statusColors = {
        ACTIVE: '#10b981',
        ON_HOLD: '#f59e0b',
        COMPLETED: '#6366f1',
        CANCELLED: '#ef4444'
    };

    const statusOptions = ['ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem' }}>Project Management</h1>
                    <p style={{ color: '#666' }}>Track projects and milestones</p>
                </div>
                <button
                    onClick={() => { setEditingProject(null); resetForm(); setShowModal(true); }}
                    style={{ padding: '0.75rem 1.5rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
                >
                    + New Project
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Projects</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6366f1' }}>{stats.total}</div>
                    </div>
                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Budget</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                            ${stats.totalBudget.toLocaleString()}
                        </div>
                    </div>
                </div>
            )}

            {/* Projects List */}
            <div style={{ display: 'grid', gap: '1rem' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>Loading...</div>
                ) : projects.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No projects found</div>
                ) : (
                    projects.map(project => (
                        <div key={project.id} style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                        <h3>{project.name}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            backgroundColor: statusColors[project.status] + '20',
                                            color: statusColors[project.status],
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600'
                                        }}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: '#666' }}>
                                        Client: {project.client.name}
                                    </div>
                                    {project.description && (
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
                                            {project.description}
                                        </div>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleEdit(project)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(project.id)}
                                        style={{ padding: '0.5rem 1rem', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    <span>Progress</span>
                                    <span style={{ fontWeight: '600' }}>{project.progress}%</span>
                                </div>
                                <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${project.progress}%`,
                                        height: '100%',
                                        backgroundColor: '#6366f1',
                                        transition: 'width 0.3s'
                                    }} />
                                </div>
                            </div>

                            {/* Project Details */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
                                {project.budget && (
                                    <div>
                                        <div style={{ color: '#666' }}>Budget</div>
                                        <div style={{ fontWeight: '600' }}>${project.budget.toLocaleString()}</div>
                                    </div>
                                )}
                                {project.startDate && (
                                    <div>
                                        <div style={{ color: '#666' }}>Start Date</div>
                                        <div style={{ fontWeight: '600' }}>{format(new Date(project.startDate), 'MMM dd, yyyy')}</div>
                                    </div>
                                )}
                                {project.endDate && (
                                    <div>
                                        <div style={{ color: '#666' }}>End Date</div>
                                        <div style={{ fontWeight: '600' }}>{format(new Date(project.endDate), 'MMM dd, yyyy')}</div>
                                    </div>
                                )}
                            </div>

                            {/* Milestones */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <h4 style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                        Milestones ({project.milestones.filter(m => m.completed).length}/{project.milestones.length})
                                    </h4>
                                    <button
                                        onClick={() => { setSelectedProject(project); setShowMilestoneModal(true); }}
                                        style={{ padding: '0.25rem 0.75rem', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem' }}
                                    >
                                        + Add Milestone
                                    </button>
                                </div>
                                {project.milestones.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {project.milestones.map(milestone => (
                                            <div key={milestone.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={milestone.completed}
                                                    onChange={() => handleToggleMilestone(project.id, milestone.id, milestone.completed)}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                                <span style={{
                                                    flex: 1,
                                                    fontSize: '0.875rem',
                                                    textDecoration: milestone.completed ? 'line-through' : 'none',
                                                    color: milestone.completed ? '#999' : '#333'
                                                }}>
                                                    {milestone.name}
                                                </span>
                                                {milestone.dueDate && (
                                                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                                                        Due: {format(new Date(milestone.dueDate), 'MMM dd')}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '0.875rem', color: '#999', textAlign: 'center', padding: '1rem' }}>
                                        No milestones yet
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Project Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>{editingProject ? 'Edit Project' : 'New Project'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Project Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Client *</label>
                                <select
                                    value={formData.clientId}
                                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">Select Client...</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows="3"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
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
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Budget</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.budget}
                                        onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Date</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingProject(null); resetForm(); }}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    {editingProject ? 'Update' : 'Create'} Project
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Milestone Modal */}
            {showMilestoneModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '400px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Add Milestone</h2>
                        <form onSubmit={handleAddMilestone}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Milestone Name *</label>
                                <input
                                    type="text"
                                    value={milestoneForm.name}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, name: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Due Date</label>
                                <input
                                    type="date"
                                    value={milestoneForm.dueDate}
                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => { setShowMilestoneModal(false); setMilestoneForm({ name: '', dueDate: '' }); }}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Add Milestone
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
