const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all expenses
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { category, status, startDate, endDate, search } = req.query;

        const where = {};

        if (category) where.category = category;
        if (status) where.status = status;

        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { description: { contains: search, mode: 'insensitive' } },
                { vendor: { contains: search, mode: 'insensitive' } }
            ];
        }

        const expenses = await prisma.expense.findMany({
            where,
            orderBy: { date: 'desc' }
        });

        res.json(expenses);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Get expense statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        const [total, byCategory, byStatus] = await Promise.all([
            prisma.expense.aggregate({
                where,
                _sum: { amount: true },
                _count: true
            }),
            prisma.expense.groupBy({
                by: ['category'],
                where,
                _sum: { amount: true },
                _count: true
            }),
            prisma.expense.groupBy({
                by: ['status'],
                where,
                _sum: { amount: true },
                _count: true
            })
        ]);

        res.json({
            totalAmount: total._sum.amount || 0,
            totalCount: total._count,
            byCategory,
            byStatus
        });
    } catch (error) {
        console.error('Get expense stats error:', error);
        res.status(500).json({ error: 'Failed to fetch expense statistics' });
    }
});

// Get single expense
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const expense = await prisma.expense.findUnique({
            where: { id: req.params.id }
        });

        if (!expense) {
            return res.status(404).json({ error: 'Expense not found' });
        }

        res.json(expense);
    } catch (error) {
        console.error('Get expense error:', error);
        res.status(500).json({ error: 'Failed to fetch expense' });
    }
});

// Create expense
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { description, amount, date, category, vendor, notes, receiptUrl, status } = req.body;

        if (!description || !amount || !date || !category) {
            return res.status(400).json({ error: 'Description, amount, date, and category are required' });
        }

        const expense = await prisma.expense.create({
            data: {
                description,
                amount: parseFloat(amount),
                date: new Date(date),
                category,
                vendor: vendor || null,
                notes: notes || null,
                receiptUrl: receiptUrl || null,
                status: status || 'PENDING',
                createdBy: req.user.id
            }
        });

        res.status(201).json(expense);
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});

// Update expense
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { description, amount, date, category, vendor, notes, receiptUrl, status } = req.body;

        const expense = await prisma.expense.update({
            where: { id: req.params.id },
            data: {
                description,
                amount: amount ? parseFloat(amount) : undefined,
                date: date ? new Date(date) : undefined,
                category,
                vendor,
                notes,
                receiptUrl,
                status
            }
        });

        res.json(expense);
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ error: 'Failed to update expense' });
    }
});

// Delete expense
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.expense.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ error: 'Failed to delete expense' });
    }
});

module.exports = router;
