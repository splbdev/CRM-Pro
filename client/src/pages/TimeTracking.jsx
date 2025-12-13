import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import Timer from '../components/Timer';

const TimeTracking = () => {
    const [timeEntries, setTimeEntries] = useState([]);
    const [clients, setClients] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [activeTimer, setActiveTimer] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showStartModal, setShowStartModal] = useState(false);
    const [showManualModal, setShowManualModal] = useState(false);

    const [filters, setFilters] = useState({
        clientId: '',
        billable: '',
        startDate: '',
        endDate: ''
    });

    const [startForm, setStartForm] = useState({
        clientId: '',
        taskId: '',
        description: '',
        hourlyRate: ''
    });

    const [manualForm, setManualForm] = useState({
        clientId: '',
        taskId: '',
        description: '',
        startTime: '',
        endTime: '',
        hourlyRate: '',
        billable: true
    });

    useEffect(() => {
        fetchTimeEntries();
        fetchActiveTimer();
        fetchClients();
        fetchStats();
    }, [filters]);

    const fetchTimeEntries = async () => {
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (filters.clientId) params.append('clientId', filters.clientId);
            if (filters.billable) params.append('billable', filters.billable);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/time-entries?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTimeEntries(response.data);
        } catch (error) {
            console.error('Fetch time entries error:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActiveTimer = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/time-entries/active`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveTimer(response.data);
        } catch (error) {
            console.error('Fetch active timer error:', error);
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
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/time-entries/stats?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStats(response.data);
        } catch (error) {
            console.error('Fetch stats error:', error);
        }
    };

    const handleStartTimer = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/time-entries/start`,
                startForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowStartModal(false);
            setStartForm({ clientId: '', taskId: '', description: '', hourlyRate: '' });
            fetchActiveTimer();
            fetchTimeEntries();
        } catch (error) {
            console.error('Start timer error:', error);
            alert(error.response?.data?.error || 'Failed to start timer');
        }
    };

    const handleStopTimer = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/time-entries/${id}/stop`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActiveTimer(null);
            fetchTimeEntries();
            fetchStats();
        } catch (error) {
            console.error('Stop timer error:', error);
        }
    };

    const handleManualEntry = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/time-entries`,
                manualForm,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowManualModal(false);
            setManualForm({
                clientId: '',
                taskId: '',
                description: '',
                startTime: '',
                endTime: '',
                hourlyRate: '',
                billable: true
            });
            fetchTimeEntries();
            fetchStats();
        } catch (error) {
            console.error('Manual entry error:', error);
            alert(error.response?.data?.error || 'Failed to create time entry');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this time entry?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/time-entries/${id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            fetchTimeEntries();
            fetchStats();
        } catch (error) {
            console.error('Delete time entry error:', error);
        }
    };

    const formatDuration = (minutes) => {
        if (!minutes) return '0h 0m';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    return (
        <div className="time-tracking-page" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Time Tracking</h1>
                <p style={{ color: '#666' }}>Track your time and manage billable hours</p>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Hours</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
                            {stats.totalHours.toFixed(1)}h
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                            {stats.totalEntries} entries
                        </div>
                    </div>

                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Billable Hours</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                            {stats.billableHours.toFixed(1)}h
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                            {stats.billableEntries} entries
                        </div>
                    </div>
                </div>
            )}

            {/* Filters and Actions */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <select
                    value={filters.clientId}
                    onChange={(e) => setFilters({ ...filters, clientId: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Clients</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                </select>

                <select
                    value={filters.billable}
                    onChange={(e) => setFilters({ ...filters, billable: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">All Types</option>
                    <option value="true">Billable Only</option>
                    <option value="false">Non-Billable Only</option>
                </select>

                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />

                <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                />

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                    <button
                        onClick={() => setShowManualModal(true)}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        + Manual Entry
                    </button>
                    <button
                        onClick={() => setShowStartModal(true)}
                        disabled={!!activeTimer}
                        style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: activeTimer ? '#9ca3af' : '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: activeTimer ? 'not-allowed' : 'pointer'
                        }}
                    >
                        ⏱️ Start Timer
                    </button>
                </div>
            </div>

            {/* Time Entries Table */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ backgroundColor: '#f9fafb' }}>
                        <tr>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Description</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Client</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Duration</th>
                            <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
                            <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center' }}>Loading...</td>
                            </tr>
                        ) : timeEntries.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>No time entries found</td>
                            </tr>
                        ) : (
                            timeEntries.map((entry) => (
                                <tr key={entry.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '1rem' }}>
                                        {format(new Date(entry.startTime), 'MMM dd, yyyy')}
                                    </td>
                                    <td style={{ padding: '1rem' }}>{entry.description}</td>
                                    <td style={{ padding: '1rem' }}>{entry.client?.name || '-'}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right', fontFamily: 'monospace' }}>
                                        {formatDuration(entry.duration)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '0.25rem 0.5rem',
                                            backgroundColor: entry.billable ? '#d1fae5' : '#fee2e2',
                                            color: entry.billable ? '#065f46' : '#991b1b',
                                            borderRadius: '4px',
                                            fontSize: '0.875rem'
                                        }}>
                                            {entry.billable ? 'Billable' : 'Non-Billable'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
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

            {/* Start Timer Modal */}
            {showStartModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '500px' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Start Timer</h2>
                        <form onSubmit={handleStartTimer}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description *</label>
                                <input
                                    type="text"
                                    value={startForm.description}
                                    onChange={(e) => setStartForm({ ...startForm, description: e.target.value })}
                                    required
                                    placeholder="What are you working on?"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Client</label>
                                <select
                                    value={startForm.clientId}
                                    onChange={(e) => setStartForm({ ...startForm, clientId: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">No Client</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hourly Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={startForm.hourlyRate}
                                    onChange={(e) => setStartForm({ ...startForm, hourlyRate: e.target.value })}
                                    placeholder="Optional"
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowStartModal(false)}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Start Timer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '2rem', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}>
                        <h2 style={{ marginBottom: '1.5rem' }}>Manual Time Entry</h2>
                        <form onSubmit={handleManualEntry}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Description *</label>
                                <input
                                    type="text"
                                    value={manualForm.description}
                                    onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                                    required
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Start Time *</label>
                                    <input
                                        type="datetime-local"
                                        value={manualForm.startTime}
                                        onChange={(e) => setManualForm({ ...manualForm, startTime: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>End Time *</label>
                                    <input
                                        type="datetime-local"
                                        value={manualForm.endTime}
                                        onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                    />
                                </div>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Client</label>
                                <select
                                    value={manualForm.clientId}
                                    onChange={(e) => setManualForm({ ...manualForm, clientId: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">No Client</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>{client.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <input
                                        type="checkbox"
                                        checked={manualForm.billable}
                                        onChange={(e) => setManualForm({ ...manualForm, billable: e.target.checked })}
                                    />
                                    <span style={{ fontWeight: '500' }}>Billable</span>
                                </label>
                            </div>

                            <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Hourly Rate</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={manualForm.hourlyRate}
                                    onChange={(e) => setManualForm({ ...manualForm, hourlyRate: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowManualModal(false)}
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Create Entry
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Floating Timer Widget */}
            <Timer
                activeTimer={activeTimer}
                onTimerStop={handleStopTimer}
            />
        </div>
    );
};

export default TimeTracking;
