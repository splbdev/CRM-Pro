const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get revenue analytics
router.get('/revenue', authMiddleware, async (req, res) => {
    try {
        const { period = 'monthly' } = req.query;

        // Get all paid invoices
        const invoices = await prisma.invoice.findMany({
            where: { status: 'PAID' },
            orderBy: { date: 'asc' }
        });

        // Group by month/year
        const revenueByPeriod = {};
        invoices.forEach(inv => {
            const date = new Date(inv.date);
            let key;
            if (period === 'yearly') {
                key = date.getFullYear().toString();
            } else if (period === 'daily') {
                key = date.toISOString().split('T')[0];
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            revenueByPeriod[key] = (revenueByPeriod[key] || 0) + inv.total;
        });

        // Convert to array for charts
        const data = Object.entries(revenueByPeriod).map(([period, amount]) => ({
            period,
            amount: Math.round(amount * 100) / 100
        }));

        // Calculate totals
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthRevenue = revenueByPeriod[currentMonth] || 0;

        // Get previous month for comparison
        const prevDate = new Date();
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonth = prevDate.toISOString().slice(0, 7);
        const lastMonthRevenue = revenueByPeriod[prevMonth] || 0;

        const growthPercent = lastMonthRevenue > 0
            ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
            : 0;

        res.json({
            data,
            summary: {
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                thisMonthRevenue: Math.round(thisMonthRevenue * 100) / 100,
                lastMonthRevenue: Math.round(lastMonthRevenue * 100) / 100,
                growthPercent
            }
        });
    } catch (error) {
        console.error('Analytics revenue error:', error);
        res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
});

// Get client analytics
router.get('/clients', authMiddleware, async (req, res) => {
    try {
        // Get clients with their invoice totals
        const clients = await prisma.client.findMany({
            include: {
                invoices: {
                    where: { status: 'PAID' }
                }
            }
        });

        // Calculate revenue per client
        const clientRevenue = clients.map(client => ({
            id: client.id,
            name: client.name,
            company: client.company,
            totalRevenue: client.invoices.reduce((sum, inv) => sum + inv.total, 0),
            invoiceCount: client.invoices.length
        }));

        // Sort by revenue (top clients)
        const topClients = clientRevenue
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10);

        // Client growth by month
        const clientsByMonth = {};
        clients.forEach(client => {
            const month = new Date(client.createdAt).toISOString().slice(0, 7);
            clientsByMonth[month] = (clientsByMonth[month] || 0) + 1;
        });

        const growthData = Object.entries(clientsByMonth)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([period, count]) => ({ period, count }));

        res.json({
            topClients,
            growthData,
            summary: {
                totalClients: clients.length,
                avgRevenuePerClient: clients.length > 0
                    ? Math.round(clientRevenue.reduce((s, c) => s + c.totalRevenue, 0) / clients.length)
                    : 0
            }
        });
    } catch (error) {
        console.error('Analytics clients error:', error);
        res.status(500).json({ error: 'Failed to fetch client analytics' });
    }
});

// Get invoice analytics
router.get('/invoices', authMiddleware, async (req, res) => {
    try {
        const invoices = await prisma.invoice.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Status breakdown
        const statusCounts = {
            DRAFT: 0,
            SENT: 0,
            PAID: 0,
            OVERDUE: 0,
            CANCELLED: 0
        };

        let totalAmount = 0;
        let paidAmount = 0;
        let overdueAmount = 0;
        let pendingAmount = 0;

        invoices.forEach(inv => {
            statusCounts[inv.status] = (statusCounts[inv.status] || 0) + 1;
            totalAmount += inv.total;

            if (inv.status === 'PAID') paidAmount += inv.total;
            else if (inv.status === 'OVERDUE') overdueAmount += inv.total;
            else if (inv.status === 'SENT') pendingAmount += inv.total;
        });

        // Calculate average payment time for paid invoices
        const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
        let avgPaymentDays = 0;
        if (paidInvoices.length > 0) {
            const totalDays = paidInvoices.reduce((sum, inv) => {
                const created = new Date(inv.createdAt);
                const updated = new Date(inv.updatedAt);
                return sum + Math.ceil((updated - created) / (1000 * 60 * 60 * 24));
            }, 0);
            avgPaymentDays = Math.round(totalDays / paidInvoices.length);
        }

        // Collection rate
        const collectionRate = totalAmount > 0
            ? Math.round((paidAmount / totalAmount) * 100)
            : 0;

        res.json({
            statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({
                status,
                count,
                amount: invoices.filter(i => i.status === status).reduce((s, i) => s + i.total, 0)
            })),
            summary: {
                totalInvoices: invoices.length,
                totalAmount: Math.round(totalAmount * 100) / 100,
                paidAmount: Math.round(paidAmount * 100) / 100,
                pendingAmount: Math.round(pendingAmount * 100) / 100,
                overdueAmount: Math.round(overdueAmount * 100) / 100,
                avgPaymentDays,
                collectionRate
            }
        });
    } catch (error) {
        console.error('Analytics invoices error:', error);
        res.status(500).json({ error: 'Failed to fetch invoice analytics' });
    }
});

// Get sales pipeline (estimates + proposals)
router.get('/pipeline', authMiddleware, async (req, res) => {
    try {
        const estimates = await prisma.estimate.findMany();
        const proposals = await prisma.proposal.findMany();

        // Estimate status breakdown
        const estimatesByStatus = {
            DRAFT: { count: 0, value: 0 },
            SENT: { count: 0, value: 0 },
            ACCEPTED: { count: 0, value: 0 },
            REJECTED: { count: 0, value: 0 }
        };

        estimates.forEach(est => {
            if (estimatesByStatus[est.status]) {
                estimatesByStatus[est.status].count++;
                estimatesByStatus[est.status].value += est.total;
            }
        });

        // Proposal status breakdown
        const proposalsByStatus = {};
        proposals.forEach(prop => {
            if (!proposalsByStatus[prop.status]) {
                proposalsByStatus[prop.status] = 0;
            }
            proposalsByStatus[prop.status]++;
        });

        // Conversion rate
        const totalEstimates = estimates.length;
        const acceptedEstimates = estimates.filter(e => e.status === 'ACCEPTED').length;
        const conversionRate = totalEstimates > 0
            ? Math.round((acceptedEstimates / totalEstimates) * 100)
            : 0;

        res.json({
            estimates: estimatesByStatus,
            proposals: proposalsByStatus,
            summary: {
                totalEstimates,
                acceptedEstimates,
                conversionRate,
                pipelineValue: estimates
                    .filter(e => e.status === 'SENT')
                    .reduce((s, e) => s + e.total, 0)
            }
        });
    } catch (error) {
        console.error('Analytics pipeline error:', error);
        res.status(500).json({ error: 'Failed to fetch pipeline analytics' });
    }
});

module.exports = router;
