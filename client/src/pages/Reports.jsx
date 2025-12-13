import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('profit-loss');
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [loading, setLoading] = useState(false);

    // Report data states
    const [profitLoss, setProfitLoss] = useState(null);
    const [cashFlow, setCashFlow] = useState(null);
    const [arAging, setArAging] = useState(null);
    const [revenueByClient, setRevenueByClient] = useState(null);
    const [clientLTV, setClientLTV] = useState(null);
    const [revenueTrend, setRevenueTrend] = useState(null);

    useEffect(() => {
        fetchReportData();
    }, [activeTab, dateRange]);

    const fetchReportData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const config = { headers: { Authorization: `Bearer ${token}` } };

            switch (activeTab) {
                case 'profit-loss':
                    const plResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/profit-loss?${params}`,
                        config
                    );
                    setProfitLoss(plResponse.data);
                    break;

                case 'cash-flow':
                    const cfResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/cash-flow?${params}`,
                        config
                    );
                    setCashFlow(cfResponse.data);
                    break;

                case 'ar-aging':
                    const arResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/ar-aging`,
                        config
                    );
                    setArAging(arResponse.data);
                    break;

                case 'revenue-by-client':
                    const rcResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/revenue-by-client?${params}`,
                        config
                    );
                    setRevenueByClient(rcResponse.data);
                    break;

                case 'client-ltv':
                    const ltvResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/client-lifetime-value`,
                        config
                    );
                    setClientLTV(ltvResponse.data);
                    break;

                case 'revenue-trend':
                    const trendResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/api/reports/revenue-trend?months=12`,
                        config
                    );
                    setRevenueTrend(trendResponse.data);
                    break;
            }
        } catch (error) {
            console.error('Fetch report error:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const tabs = [
        { id: 'profit-loss', label: 'Profit & Loss' },
        { id: 'cash-flow', label: 'Cash Flow' },
        { id: 'ar-aging', label: 'AR Aging' },
        { id: 'revenue-by-client', label: 'Revenue by Client' },
        { id: 'client-ltv', label: 'Client LTV' },
        { id: 'revenue-trend', label: 'Revenue Trend' }
    ];

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Reports & Analytics</h1>
                <p style={{ color: '#666' }}>Financial insights and business intelligence</p>
            </div>

            {/* Date Range Filter */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Start Date</label>
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>End Date</label>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                </div>
                <button
                    onClick={() => setDateRange({ startDate: '', endDate: '' })}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '1.5rem' }}
                >
                    Clear
                </button>
            </div>

            {/* Tabs */}
            <div style={{ borderBottom: '2px solid #e5e7eb', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto' }}>
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.75rem 1.5rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                                color: activeTab === tab.id ? '#6366f1' : '#666',
                                fontWeight: activeTab === tab.id ? '600' : '400',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Report Content */}
            <div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>Loading report...</div>
                ) : (
                    <>
                        {activeTab === 'profit-loss' && profitLoss && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Revenue</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                            ${profitLoss.revenue.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                            {profitLoss.revenueCount} paid invoices
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Expenses</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>
                                            ${profitLoss.expenses.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                            {profitLoss.expenseCount} expenses
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Net Profit</div>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: profitLoss.profit >= 0 ? '#10b981' : '#ef4444' }}>
                                            ${profitLoss.profit.toLocaleString()}
                                        </div>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                                            {profitLoss.profitMargin}% margin
                                        </div>
                                    </div>
                                </div>

                                {profitLoss.expensesByCategory && profitLoss.expensesByCategory.length > 0 && (
                                    <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <h3 style={{ marginBottom: '1rem' }}>Expenses by Category</h3>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={profitLoss.expensesByCategory.map(item => ({
                                                        name: item.category,
                                                        value: item._sum.amount
                                                    }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {profitLoss.expensesByCategory.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'cash-flow' && cashFlow && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Income</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                                            ${cashFlow.totalIncome.toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Total Outflow</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>
                                            ${cashFlow.totalExpenses.toLocaleString()}
                                        </div>
                                    </div>

                                    <div style={{ padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.5rem' }}>Net Cash Flow</div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: cashFlow.netCashFlow >= 0 ? '#10b981' : '#ef4444' }}>
                                            ${cashFlow.netCashFlow.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>Cash Flow Timeline</h3>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <LineChart data={cashFlow.transactions}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="date" tickFormatter={(date) => format(new Date(date), 'MMM dd')} />
                                            <YAxis />
                                            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                            <Legend />
                                            <Line type="monotone" dataKey="balance" stroke="#6366f1" strokeWidth={2} name="Running Balance" />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ar-aging' && arAging && (
                            <div>
                                <div style={{ marginBottom: '2rem', padding: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    <h3 style={{ marginBottom: '1rem' }}>Total Outstanding: ${arAging.grandTotal.toLocaleString()}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                        <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>Current</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                                                ${arAging.totals.current.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#fef9c3', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>1-30 Days</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                                ${arAging.totals.days1to30.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#fed7aa', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>31-60 Days</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#f97316' }}>
                                                ${arAging.totals.days31to60.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#fecaca', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>61-90 Days</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ef4444' }}>
                                                ${arAging.totals.days61to90.toLocaleString()}
                                            </div>
                                        </div>
                                        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '6px' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem' }}>90+ Days</div>
                                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626' }}>
                                                ${arAging.totals.over90.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {Object.entries(arAging.aging).map(([bucket, invoices]) => (
                                    invoices.length > 0 && (
                                        <div key={bucket} style={{ marginBottom: '1.5rem', backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                            <h4 style={{ marginBottom: '1rem', textTransform: 'capitalize' }}>
                                                {bucket.replace(/([A-Z])/g, ' $1').trim()} ({invoices.length})
                                            </h4>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead style={{ backgroundColor: '#f9fafb' }}>
                                                    <tr>
                                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Invoice</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Client</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Due Date</th>
                                                        <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Days Overdue</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {invoices.map(inv => (
                                                        <tr key={inv.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                            <td style={{ padding: '0.75rem' }}>{inv.number}</td>
                                                            <td style={{ padding: '0.75rem' }}>{inv.client}</td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                                                                ${inv.amount.toLocaleString()}
                                                            </td>
                                                            <td style={{ padding: '0.75rem' }}>
                                                                {format(new Date(inv.dueDate), 'MMM dd, yyyy')}
                                                            </td>
                                                            <td style={{ padding: '0.75rem', textAlign: 'right', color: inv.daysOverdue > 0 ? '#ef4444' : '#10b981' }}>
                                                                {inv.daysOverdue > 0 ? `+${inv.daysOverdue}` : inv.daysOverdue}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                ))}
                            </div>
                        )}

                        {activeTab === 'revenue-by-client' && revenueByClient && (
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Top Clients by Revenue</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={revenueByClient.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="clientName" angle={-45} textAnchor="end" height={100} />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                        <Bar dataKey="revenue" fill="#6366f1" />
                                    </BarChart>
                                </ResponsiveContainer>

                                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
                                    <thead style={{ backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Rank</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Client</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Revenue</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Invoices</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {revenueByClient.map((client, index) => (
                                            <tr key={client.clientId} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '0.75rem' }}>#{index + 1}</td>
                                                <td style={{ padding: '0.75rem' }}>{client.clientName}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                                                    ${client.revenue.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    {client.invoiceCount}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'client-ltv' && clientLTV && (
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Client Lifetime Value Analysis</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ backgroundColor: '#f9fafb' }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: '600' }}>Client</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Total Revenue</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Invoices</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Avg Invoice</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Months Active</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>Monthly Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientLTV.map(client => (
                                            <tr key={client.clientId} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                <td style={{ padding: '0.75rem' }}>{client.clientName}</td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: '#10b981' }}>
                                                    ${client.totalRevenue.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    {client.invoiceCount}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    ${client.averageInvoiceValue.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                                                    {client.monthsActive}
                                                </td>
                                                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>
                                                    ${client.monthlyAverage.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {activeTab === 'revenue-trend' && revenueTrend && (
                            <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                <h3 style={{ marginBottom: '1.5rem' }}>Monthly Revenue Trend (Last 12 Months)</h3>
                                <ResponsiveContainer width="100%" height={400}>
                                    <LineChart data={revenueTrend}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} name="Revenue" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Reports;
