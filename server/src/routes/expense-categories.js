const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all expense categories
router.get('/', authMiddleware, async (req, res) => {
    try {
        const categories = await prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' }
        });

        res.json(categories);
    } catch (error) {
        console.error('Get expense categories error:', error);
        res.status(500).json({ error: 'Failed to fetch expense categories' });
    }
});

// Create expense category
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const category = await prisma.expenseCategory.create({
            data: {
                name,
                color: color || '#6366f1'
            }
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        console.error('Create expense category error:', error);
        res.status(500).json({ error: 'Failed to create expense category' });
    }
});

// Update expense category
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, color } = req.body;

        const category = await prisma.expenseCategory.update({
            where: { id: req.params.id },
            data: { name, color }
        });

        res.json(category);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Category name already exists' });
        }
        console.error('Update expense category error:', error);
        res.status(500).json({ error: 'Failed to update expense category' });
    }
});

// Delete expense category
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.expenseCategory.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Expense category deleted successfully' });
    } catch (error) {
        console.error('Delete expense category error:', error);
        res.status(500).json({ error: 'Failed to delete expense category' });
    }
});

module.exports = router;
