const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Start timer
router.post('/start', authMiddleware, async (req, res) => {
    try {
        const { clientId, taskId, description, hourlyRate } = req.body;

        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const timeEntry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                clientId: clientId || null,
                taskId: taskId || null,
                description,
                startTime: new Date(),
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
                billable: true
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } }
            }
        });

        res.status(201).json(timeEntry);
    } catch (error) {
        console.error('Start timer error:', error);
        res.status(500).json({ error: 'Failed to start timer' });
    }
});

// Stop timer
router.put('/:id/stop', authMiddleware, async (req, res) => {
    try {
        const timeEntry = await prisma.timeEntry.findUnique({
            where: { id: req.params.id }
        });

        if (!timeEntry) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        if (timeEntry.endTime) {
            return res.status(400).json({ error: 'Timer already stopped' });
        }

        const endTime = new Date();
        const duration = Math.floor((endTime - new Date(timeEntry.startTime)) / 1000 / 60); // minutes

        const updated = await prisma.timeEntry.update({
            where: { id: req.params.id },
            data: {
                endTime,
                duration
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } }
            }
        });

        res.json(updated);
    } catch (error) {
        console.error('Stop timer error:', error);
        res.status(500).json({ error: 'Failed to stop timer' });
    }
});

// Get all time entries
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { userId, clientId, taskId, billable, invoiced, startDate, endDate } = req.query;

        const where = {};

        if (userId) where.userId = userId;
        if (clientId) where.clientId = clientId;
        if (taskId) where.taskId = taskId;
        if (billable !== undefined) where.billable = billable === 'true';
        if (invoiced !== undefined) where.invoiced = invoiced === 'true';

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate);
            if (endDate) where.startTime.lte = new Date(endDate);
        }

        const timeEntries = await prisma.timeEntry.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } }
            },
            orderBy: { startTime: 'desc' }
        });

        res.json(timeEntries);
    } catch (error) {
        console.error('Get time entries error:', error);
        res.status(500).json({ error: 'Failed to fetch time entries' });
    }
});

// Get active timer for current user
router.get('/active', authMiddleware, async (req, res) => {
    try {
        const activeTimer = await prisma.timeEntry.findFirst({
            where: {
                userId: req.user.id,
                endTime: null
            },
            include: {
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } }
            }
        });

        res.json(activeTimer);
    } catch (error) {
        console.error('Get active timer error:', error);
        res.status(500).json({ error: 'Failed to fetch active timer' });
    }
});

// Create manual time entry
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, taskId, description, startTime, endTime, duration, hourlyRate, billable } = req.body;

        if (!description || !startTime || !endTime) {
            return res.status(400).json({ error: 'Description, start time, and end time are required' });
        }

        const start = new Date(startTime);
        const end = new Date(endTime);
        const calculatedDuration = duration || Math.floor((end - start) / 1000 / 60);

        const timeEntry = await prisma.timeEntry.create({
            data: {
                userId: req.user.id,
                clientId: clientId || null,
                taskId: taskId || null,
                description,
                startTime: start,
                endTime: end,
                duration: calculatedDuration,
                hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
                billable: billable !== undefined ? billable : true
            },
            include: {
                user: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } }
            }
        });

        res.status(201).json(timeEntry);
    } catch (error) {
        console.error('Create time entry error:', error);
        res.status(500).json({ error: 'Failed to create time entry' });
    }
});

// Update time entry
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { description, startTime, endTime, duration, hourlyRate, billable, clientId, taskId } = req.body;

        const data = {};
        if (description) data.description = description;
        if (startTime) data.startTime = new Date(startTime);
        if (endTime) data.endTime = new Date(endTime);
        if (duration !== undefined) data.duration = duration;
        if (hourlyRate !== undefined) data.hourlyRate = parseFloat(hourlyRate);
        if (billable !== undefined) data.billable = billable;
        if (clientId !== undefined) data.clientId = clientId || null;
        if (taskId !== undefined) data.taskId = taskId || null;

        const timeEntry = await prisma.timeEntry.update({
            where: { id: req.params.id },
            data,
            include: {
                user: { select: { id: true, name: true, email: true } },
                client: { select: { id: true, name: true } },
                task: { select: { id: true, title: true } }
            }
        });

        res.json(timeEntry);
    } catch (error) {
        console.error('Update time entry error:', error);
        res.status(500).json({ error: 'Failed to update time entry' });
    }
});

// Delete time entry
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.timeEntry.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Time entry deleted successfully' });
    } catch (error) {
        console.error('Delete time entry error:', error);
        res.status(500).json({ error: 'Failed to delete time entry' });
    }
});

// Get time entry statistics
router.get('/stats', authMiddleware, async (req, res) => {
    try {
        const { userId, clientId, startDate, endDate } = req.query;

        const where = {};
        if (userId) where.userId = userId;
        if (clientId) where.clientId = clientId;

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate);
            if (endDate) where.startTime.lte = new Date(endDate);
        }

        const [totalEntries, billableEntries, totalMinutes, billableMinutes] = await Promise.all([
            prisma.timeEntry.count({ where }),
            prisma.timeEntry.count({ where: { ...where, billable: true } }),
            prisma.timeEntry.aggregate({
                where,
                _sum: { duration: true }
            }),
            prisma.timeEntry.aggregate({
                where: { ...where, billable: true },
                _sum: { duration: true }
            })
        ]);

        res.json({
            totalEntries,
            billableEntries,
            totalHours: (totalMinutes._sum.duration || 0) / 60,
            billableHours: (billableMinutes._sum.duration || 0) / 60,
            totalMinutes: totalMinutes._sum.duration || 0,
            billableMinutes: billableMinutes._sum.duration || 0
        });
    } catch (error) {
        console.error('Get time stats error:', error);
        res.status(500).json({ error: 'Failed to fetch time statistics' });
    }
});

module.exports = router;
