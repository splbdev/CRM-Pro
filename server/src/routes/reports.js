const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Profit & Loss Report (Enhanced)
router.get('/profit-loss', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        // Get revenue from paid invoices
        const invoiceWhere = { status: 'PAID' };
        if (startDate || endDate) {
            invoiceWhere.date = {};
            if (startDate) invoiceWhere.date.gte = new Date(startDate);
            if (endDate) invoiceWhere.date.lte = new Date(endDate);
        }

        const [revenue, expenses, expensesByCategory] = await Promise.all([
            prisma.invoice.aggregate({
                where: invoiceWhere,
                _sum: { total: true },
                _count: true
            }),
            prisma.expense.aggregate({
                where,
                _sum: { amount: true },
                _count: true
            }),
            prisma.expense.groupBy({
                by: ['category'],
                where,
                _sum: { amount: true }
            })
        ]);

        const totalRevenue = revenue._sum.total || 0;
        const totalExpenses = expenses._sum.amount || 0;
        const profit = totalRevenue - totalExpenses;

        res.json({
            revenue: totalRevenue,
            revenueCount: revenue._count,
            expenses: totalExpenses,
            expenseCount: expenses._count,
            profit,
            profitMargin: totalRevenue > 0 ? ((profit / totalRevenue) * 100).toFixed(2) : 0,
            expensesByCategory
        });
    } catch (error) {
        console.error('Profit/Loss error:', error);
        res.status(500).json({ error: 'Failed to calculate profit/loss' });
    }
});

// Cash Flow Report
router.get('/cash-flow', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [paidInvoices, expenses] = await Promise.all([
            prisma.invoice.findMany({
                where: { ...where, status: 'PAID' },
                select: { date: true, total: true, number: true },
                orderBy: { date: 'asc' }
            }),
            prisma.expense.findMany({
                where,
                select: { date: true, amount: true, description: true },
                orderBy: { date: 'asc' }
            })
        ]);

        // Combine and sort by date
        const transactions = [
            ...paidInvoices.map(inv => ({
                date: inv.date,
                type: 'INCOME',
                amount: inv.total,
                description: `Invoice ${inv.number}`
            })),
            ...expenses.map(exp => ({
                date: exp.date,
                type: 'EXPENSE',
                amount: -exp.amount,
                description: exp.description
            }))
        ].sort((a, b) => new Date(a.date) - new Date(b.date));

        // Calculate running balance
        let balance = 0;
        const cashFlow = transactions.map(t => {
            balance += t.amount;
            return { ...t, balance };
        });

        res.json({
            transactions: cashFlow,
            totalIncome: paidInvoices.reduce((sum, inv) => sum + inv.total, 0),
            totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
            netCashFlow: balance
        });
    } catch (error) {
        console.error('Cash flow error:', error);
        res.status(500).json({ error: 'Failed to generate cash flow report' });
    }
});

// Accounts Receivable Aging Report
router.get('/ar-aging', authMiddleware, async (req, res) => {
    try {
        const now = new Date();

        const unpaidInvoices = await prisma.invoice.findMany({
            where: {
                status: { in: ['SENT', 'OVERDUE'] }
            },
            include: {
                client: { select: { name: true } }
            },
            orderBy: { dueDate: 'asc' }
        });

        const aging = {
            current: [],
            days1to30: [],
            days31to60: [],
            days61to90: [],
            over90: []
        };

        let totals = {
            current: 0,
            days1to30: 0,
            days31to60: 0,
            days61to90: 0,
            over90: 0
        };

        unpaidInvoices.forEach(invoice => {
            const daysOverdue = Math.floor((now - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24));
            const item = {
                id: invoice.id,
                number: invoice.number,
                client: invoice.client.name,
                amount: invoice.total,
                dueDate: invoice.dueDate,
                daysOverdue
            };

            if (daysOverdue < 0) {
                aging.current.push(item);
                totals.current += invoice.total;
            } else if (daysOverdue <= 30) {
                aging.days1to30.push(item);
                totals.days1to30 += invoice.total;
            } else if (daysOverdue <= 60) {
                aging.days31to60.push(item);
                totals.days31to60 += invoice.total;
            } else if (daysOverdue <= 90) {
                aging.days61to90.push(item);
                totals.days61to90 += invoice.total;
            } else {
                aging.over90.push(item);
                totals.over90 += invoice.total;
            }
        });

        res.json({
            aging,
            totals,
            grandTotal: Object.values(totals).reduce((sum, val) => sum + val, 0)
        });
    } catch (error) {
        console.error('AR aging error:', error);
        res.status(500).json({ error: 'Failed to generate AR aging report' });
    }
});

// Revenue by Client
router.get('/revenue-by-client', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = { status: 'PAID' };
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const revenueByClient = await prisma.invoice.groupBy({
            by: ['clientId'],
            where,
            _sum: { total: true },
            _count: true
        });

        // Get client names
        const clientIds = revenueByClient.map(r => r.clientId);
        const clients = await prisma.client.findMany({
            where: { id: { in: clientIds } },
            select: { id: true, name: true }
        });

        const clientMap = Object.fromEntries(clients.map(c => [c.id, c.name]));

        const result = revenueByClient.map(r => ({
            clientId: r.clientId,
            clientName: clientMap[r.clientId] || 'Unknown',
            revenue: r._sum.total || 0,
            invoiceCount: r._count
        })).sort((a, b) => b.revenue - a.revenue);

        res.json(result);
    } catch (error) {
        console.error('Revenue by client error:', error);
        res.status(500).json({ error: 'Failed to generate revenue by client report' });
    }
});

// Client Lifetime Value
router.get('/client-lifetime-value', authMiddleware, async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            include: {
                invoices: {
                    where: { status: 'PAID' },
                    select: { total: true, date: true }
                }
            }
        });

        const clv = clients.map(client => {
            const totalRevenue = client.invoices.reduce((sum, inv) => sum + inv.total, 0);
            const invoiceCount = client.invoices.length;
            const firstInvoice = client.invoices.length > 0
                ? new Date(Math.min(...client.invoices.map(i => new Date(i.date))))
                : null;
            const lastInvoice = client.invoices.length > 0
                ? new Date(Math.max(...client.invoices.map(i => new Date(i.date))))
                : null;

            const monthsActive = firstInvoice && lastInvoice
                ? Math.max(1, Math.floor((lastInvoice - firstInvoice) / (1000 * 60 * 60 * 24 * 30)))
                : 0;

            return {
                clientId: client.id,
                clientName: client.name,
                totalRevenue,
                invoiceCount,
                averageInvoiceValue: invoiceCount > 0 ? totalRevenue / invoiceCount : 0,
                monthsActive,
                monthlyAverage: monthsActive > 0 ? totalRevenue / monthsActive : 0,
                firstInvoice,
                lastInvoice
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        res.json(clv);
    } catch (error) {
        console.error('CLV error:', error);
        res.status(500).json({ error: 'Failed to calculate client lifetime value' });
    }
});

// Monthly Revenue Trend
router.get('/revenue-trend', authMiddleware, async (req, res) => {
    try {
        const { months = 12 } = req.query;

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - parseInt(months));

        const invoices = await prisma.invoice.findMany({
            where: {
                status: 'PAID',
                date: { gte: startDate }
            },
            select: { date: true, total: true }
        });

        // Group by month
        const monthlyRevenue = {};
        invoices.forEach(inv => {
            const month = new Date(inv.date).toISOString().slice(0, 7); // YYYY-MM
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + inv.total;
        });

        const trend = Object.entries(monthlyRevenue)
            .map(([month, revenue]) => ({ month, revenue }))
            .sort((a, b) => a.month.localeCompare(b.month));

        res.json(trend);
    } catch (error) {
        console.error('Revenue trend error:', error);
        res.status(500).json({ error: 'Failed to generate revenue trend' });
    }
});

module.exports = router;
