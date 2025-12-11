import { useState, useEffect } from 'react';
import { analytics } from '../api';
import {
    FiTrendingUp, FiTrendingDown, FiUsers, FiDollarSign,
    FiFileText, FiPercent, FiClock, FiPieChart
} from 'react-icons/fi';

export default function Analytics() {
    const [revenueData, setRevenueData] = useState(null);
    const [clientData, setClientData] = useState(null);
    const [invoiceData, setInvoiceData] = useState(null);
    const [pipelineData, setPipelineData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        loadData();
    }, [period]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [revenue, clients, invoices, pipeline] = await Promise.all([
                analytics.getRevenue(period),
                analytics.getClients(),
                analytics.getInvoices(),
                analytics.getPipeline()
            ]);
            setRevenueData(revenue.data);
            setClientData(clients.data);
            setInvoiceData(invoices.data);
            setPipelineData(pipeline.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="page">
                <div className="loading"><div className="spinner"></div></div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Analytics</h1>
                    <p className="page-subtitle">Insights into your business performance</p>
                </div>
                <div className="btn-group">
                    <button
                        className={`btn btn-sm ${period === 'daily' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPeriod('daily')}
                    >
                        Daily
                    </button>
                    <button
                        className={`btn btn-sm ${period === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPeriod('monthly')}
                    >
                        Monthly
                    </button>
                    <button
                        className={`btn btn-sm ${period === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPeriod('yearly')}
                    >
                        Yearly
                    </button>
                </div>
            </div>

            {/* Revenue Overview Stats */}
            <div className="grid grid-4" style={{ marginBottom: 32 }}>
                <div className="stat-card">
                    <div className="stat-icon success"><FiDollarSign /></div>
                    <div className="stat-value">{formatCurrency(revenueData?.summary?.totalRevenue)}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon primary"><FiDollarSign /></div>
                    <div className="stat-value">{formatCurrency(revenueData?.summary?.thisMonthRevenue)}</div>
                    <div className="stat-label">This Month</div>
                    {revenueData?.summary?.growthPercent !== 0 && (
                        <div className={`stat-change ${revenueData?.summary?.growthPercent > 0 ? 'positive' : 'negative'}`}>
                            {revenueData?.summary?.growthPercent > 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                            {Math.abs(revenueData?.summary?.growthPercent)}% vs last month
                        </div>
                    )}
                </div>

                <div className="stat-card">
                    <div className="stat-icon info"><FiUsers /></div>
                    <div className="stat-value">{clientData?.summary?.totalClients || 0}</div>
                    <div className="stat-label">Total Clients</div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon warning"><FiPercent /></div>
                    <div className="stat-value">{invoiceData?.summary?.collectionRate || 0}%</div>
                    <div className="stat-label">Collection Rate</div>
                </div>
            </div>

            {/* Revenue Chart */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div className="card-header">
                    <h3 className="card-title">Revenue Trend</h3>
                </div>
                <div style={{ padding: 20 }}>
                    {revenueData?.data?.length > 0 ? (
                        <div className="chart-container">
                            <div className="bar-chart">
                                {revenueData.data.slice(-12).map((item, index) => {
                                    const maxValue = Math.max(...revenueData.data.map(d => d.amount));
                                    const height = maxValue > 0 ? (item.amount / maxValue) * 200 : 0;
                                    return (
                                        <div key={index} className="bar-item">
                                            <div
                                                className="bar"
                                                style={{ height: `${height}px` }}
                                                title={`${item.period}: ${formatCurrency(item.amount)}`}
                                            />
                                            <span className="bar-label">{item.period.slice(-5)}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <FiTrendingUp className="empty-state-icon" />
                            <p>No revenue data available</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-2" style={{ marginBottom: 24 }}>
                {/* Invoice Statistics */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Invoice Overview</h3>
                    </div>
                    <div style={{ padding: 20 }}>
                        <div className="stats-list">
                            <div className="stats-row">
                                <span className="stats-label"><FiFileText /> Total Invoices</span>
                                <span className="stats-value">{invoiceData?.summary?.totalInvoices || 0}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stats-label"><FiDollarSign /> Total Amount</span>
                                <span className="stats-value">{formatCurrency(invoiceData?.summary?.totalAmount)}</span>
                            </div>
                            <div className="stats-row success">
                                <span className="stats-label">Paid</span>
                                <span className="stats-value">{formatCurrency(invoiceData?.summary?.paidAmount)}</span>
                            </div>
                            <div className="stats-row warning">
                                <span className="stats-label">Pending</span>
                                <span className="stats-value">{formatCurrency(invoiceData?.summary?.pendingAmount)}</span>
                            </div>
                            <div className="stats-row danger">
                                <span className="stats-label">Overdue</span>
                                <span className="stats-value">{formatCurrency(invoiceData?.summary?.overdueAmount)}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stats-label"><FiClock /> Avg. Payment Time</span>
                                <span className="stats-value">{invoiceData?.summary?.avgPaymentDays || 0} days</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pipeline Stats */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Sales Pipeline</h3>
                    </div>
                    <div style={{ padding: 20 }}>
                        <div className="stats-list">
                            <div className="stats-row">
                                <span className="stats-label"><FiPieChart /> Total Estimates</span>
                                <span className="stats-value">{pipelineData?.summary?.totalEstimates || 0}</span>
                            </div>
                            <div className="stats-row success">
                                <span className="stats-label">Accepted</span>
                                <span className="stats-value">{pipelineData?.summary?.acceptedEstimates || 0}</span>
                            </div>
                            <div className="stats-row">
                                <span className="stats-label"><FiPercent /> Conversion Rate</span>
                                <span className="stats-value">{pipelineData?.summary?.conversionRate || 0}%</span>
                            </div>
                            <div className="stats-row info">
                                <span className="stats-label">Pipeline Value</span>
                                <span className="stats-value">{formatCurrency(pipelineData?.summary?.pipelineValue)}</span>
                            </div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="status-breakdown" style={{ marginTop: 16 }}>
                            {pipelineData?.estimates && Object.entries(pipelineData.estimates).map(([status, data]) => (
                                <div key={status} className="status-item">
                                    <span className={`badge badge-${getStatusClass(status)}`}>{status}</span>
                                    <span>{data.count} ({formatCurrency(data.value)})</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Clients */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Top Clients by Revenue</h3>
                </div>
                {clientData?.topClients?.length > 0 ? (
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Client</th>
                                    <th>Company</th>
                                    <th>Invoices</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientData.topClients.map((client, index) => (
                                    <tr key={client.id}>
                                        <td>
                                            <span className={`rank rank-${index + 1}`}>#{index + 1}</span>
                                        </td>
                                        <td><strong>{client.name}</strong></td>
                                        <td>{client.company || '-'}</td>
                                        <td>{client.invoiceCount}</td>
                                        <td className="revenue">{formatCurrency(client.totalRevenue)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="empty-state" style={{ padding: 40 }}>
                        <FiUsers className="empty-state-icon" />
                        <p>No client data available</p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusClass(status) {
    switch (status) {
        case 'PAID':
        case 'ACCEPTED': return 'success';
        case 'SENT': return 'info';
        case 'OVERDUE':
        case 'REJECTED': return 'danger';
        case 'DRAFT': return 'default';
        default: return 'default';
    }
}
