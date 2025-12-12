const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const reminderService = require('../services/reminder');

const router = express.Router();
const prisma = new PrismaClient();

// Get all reminder configurations
router.get('/config', authMiddleware, async (req, res) => {
    try {
        const configs = await prisma.reminderConfig.findMany({
            orderBy: { type: 'asc' }
        });

        // If no configs exist, create defaults
        if (configs.length === 0) {
            const defaultConfigs = [
                {
                    type: 'INVOICE_OVERDUE',
                    enabled: true,
                    daysAfter: 1,
                    channels: ['EMAIL']
                },
                {
                    type: 'INVOICE_DUE_SOON',
                    enabled: true,
                    daysBefore: 3,
                    channels: ['EMAIL']
                },
                {
                    type: 'ESTIMATE_FOLLOWUP',
                    enabled: false,
                    daysAfter: 7,
                    channels: ['EMAIL']
                }
            ];

            for (const config of defaultConfigs) {
                await prisma.reminderConfig.create({ data: config });
            }

            const newConfigs = await prisma.reminderConfig.findMany({
                orderBy: { type: 'asc' }
            });
            return res.json(newConfigs);
        }

        res.json(configs);
    } catch (error) {
        console.error('Get reminder configs error:', error);
        res.status(500).json({ error: 'Failed to fetch reminder configurations' });
    }
});

// Update reminder configuration
router.put('/config/:id', authMiddleware, async (req, res) => {
    try {
        const { enabled, daysBefore, daysAfter, templateId, channels } = req.body;

        const config = await prisma.reminderConfig.update({
            where: { id: req.params.id },
            data: {
                enabled,
                daysBefore,
                daysAfter,
                templateId,
                channels
            }
        });

        res.json(config);
    } catch (error) {
        console.error('Update reminder config error:', error);
        res.status(500).json({ error: 'Failed to update reminder configuration' });
    }
});

// Get reminder logs
router.get('/logs', authMiddleware, async (req, res) => {
    try {
        const { entityType, entityId, limit = 50 } = req.query;

        const where = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;

        const logs = await prisma.reminderLog.findMany({
            where,
            orderBy: { sentAt: 'desc' },
            take: parseInt(limit)
        });

        res.json(logs);
    } catch (error) {
        console.error('Get reminder logs error:', error);
        res.status(500).json({ error: 'Failed to fetch reminder logs' });
    }
});

// Send manual reminder for an invoice
router.post('/send-now/:invoiceId', authMiddleware, async (req, res) => {
    try {
        const result = await reminderService.sendManualReminder(req.params.invoiceId);
        res.json(result);
    } catch (error) {
        console.error('Send manual reminder error:', error);
        res.status(500).json({ error: error.message || 'Failed to send reminder' });
    }
});

// Test reminder system (check now)
router.post('/test', authMiddleware, async (req, res) => {
    try {
        const overdueCount = await reminderService.checkOverdueInvoices();
        const dueSoonCount = await reminderService.checkDueSoonInvoices();

        res.json({
            success: true,
            overdueReminders: overdueCount,
            dueSoonReminders: dueSoonCount
        });
    } catch (error) {
        console.error('Test reminders error:', error);
        res.status(500).json({ error: 'Failed to test reminders' });
    }
});

module.exports = router;
