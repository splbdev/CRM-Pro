const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all leads
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, source, assignedTo, search } = req.query;

        const where = {};
        if (status) where.status = status;
        if (source) where.source = source;
        if (assignedTo) where.assignedTo = assignedTo;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } }
            ];
        }

        const leads = await prisma.lead.findMany({
            where,
            include: {
                assignee: { select: { id: true, name: true, email: true } }
            },
            orderBy: [
                { score: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json(leads);
    } catch (error) {
        console.error('Get leads error:', error);
        res.status(500).json({ error: 'Failed to fetch leads' });
    }
});

// Get single lead
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: req.params.id },
            include: {
                assignee: { select: { id: true, name: true, email: true } }
            }
        });

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        res.json(lead);
    } catch (error) {
        console.error('Get lead error:', error);
        res.status(500).json({ error: 'Failed to fetch lead' });
    }
});

// Create lead
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, company, source, status, score, notes, assignedTo } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const lead = await prisma.lead.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                company: company || null,
                source: source || null,
                status: status || 'NEW',
                score: score || 0,
                notes: notes || null,
                assignedTo: assignedTo || null
            },
            include: {
                assignee: { select: { id: true, name: true, email: true } }
            }
        });

        res.status(201).json(lead);
    } catch (error) {
        console.error('Create lead error:', error);
        res.status(500).json({ error: 'Failed to create lead' });
    }
});

// Update lead
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, email, phone, company, source, status, score, notes, assignedTo } = req.body;

        const data = {};
        if (name) data.name = name;
        if (email !== undefined) data.email = email || null;
        if (phone !== undefined) data.phone = phone || null;
        if (company !== undefined) data.company = company || null;
        if (source !== undefined) data.source = source || null;
        if (status) data.status = status;
        if (score !== undefined) data.score = score;
        if (notes !== undefined) data.notes = notes || null;
        if (assignedTo !== undefined) data.assignedTo = assignedTo || null;

        const lead = await prisma.lead.update({
            where: { id: req.params.id },
            data,
            include: {
                assignee: { select: { id: true, name: true, email: true } }
            }
        });

        res.json(lead);
    } catch (error) {
        console.error('Update lead error:', error);
        res.status(500).json({ error: 'Failed to update lead' });
    }
});

// Delete lead
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.lead.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Lead deleted successfully' });
    } catch (error) {
        console.error('Delete lead error:', error);
        res.status(500).json({ error: 'Failed to delete lead' });
    }
});

// Convert lead to client
router.post('/:id/convert', authMiddleware, async (req, res) => {
    try {
        const lead = await prisma.lead.findUnique({
            where: { id: req.params.id }
        });

        if (!lead) {
            return res.status(404).json({ error: 'Lead not found' });
        }

        // Create client from lead
        const client = await prisma.client.create({
            data: {
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                company: lead.company,
                notes: lead.notes
            }
        });

        // Update lead with converted client ID
        await prisma.lead.update({
            where: { id: req.params.id },
            data: {
                status: 'WON',
                convertedToClientId: client.id
            }
        });

        res.json({ client, message: 'Lead converted to client successfully' });
    } catch (error) {
        console.error('Convert lead error:', error);
        res.status(500).json({ error: 'Failed to convert lead' });
    }
});

// Get lead statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
    try {
        const [total, byStatus, bySource, avgScore] = await Promise.all([
            prisma.lead.count(),
            prisma.lead.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.lead.groupBy({
                by: ['source'],
                _count: true
            }),
            prisma.lead.aggregate({
                _avg: { score: true }
            })
        ]);

        res.json({
            total,
            byStatus,
            bySource,
            averageScore: avgScore._avg.score || 0
        });
    } catch (error) {
        console.error('Get lead stats error:', error);
        res.status(500).json({ error: 'Failed to fetch lead statistics' });
    }
});

module.exports = router;
