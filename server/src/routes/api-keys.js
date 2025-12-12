const express = require('express');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Generate API key
function generateApiKey() {
    return 'crm_' + crypto.randomBytes(32).toString('hex');
}

// Get all API keys for user
router.get('/', authMiddleware, async (req, res) => {
    try {
        const apiKeys = await prisma.apiKey.findMany({
            where: { userId: req.user.id },
            select: {
                id: true,
                name: true,
                key: true,
                permissions: true,
                isActive: true,
                lastUsedAt: true,
                expiresAt: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(apiKeys);
    } catch (error) {
        console.error('Get API keys error:', error);
        res.status(500).json({ error: 'Failed to fetch API keys' });
    }
});

// Create API key
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, permissions, expiresAt } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const key = generateApiKey();

        const apiKey = await prisma.apiKey.create({
            data: {
                name,
                key,
                userId: req.user.id,
                permissions: permissions || ['read'],
                expiresAt: expiresAt ? new Date(expiresAt) : null
            }
        });

        res.status(201).json(apiKey);
    } catch (error) {
        console.error('Create API key error:', error);
        res.status(500).json({ error: 'Failed to create API key' });
    }
});

// Update API key
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, permissions, isActive, expiresAt } = req.body;

        const data = {};
        if (name) data.name = name;
        if (permissions) data.permissions = permissions;
        if (isActive !== undefined) data.isActive = isActive;
        if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;

        const apiKey = await prisma.apiKey.update({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            data
        });

        res.json(apiKey);
    } catch (error) {
        console.error('Update API key error:', error);
        res.status(500).json({ error: 'Failed to update API key' });
    }
});

// Delete API key
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.apiKey.delete({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        res.json({ message: 'API key deleted successfully' });
    } catch (error) {
        console.error('Delete API key error:', error);
        res.status(500).json({ error: 'Failed to delete API key' });
    }
});

// Regenerate API key
router.post('/:id/regenerate', authMiddleware, async (req, res) => {
    try {
        const newKey = generateApiKey();

        const apiKey = await prisma.apiKey.update({
            where: {
                id: req.params.id,
                userId: req.user.id
            },
            data: {
                key: newKey,
                lastUsedAt: null
            }
        });

        res.json(apiKey);
    } catch (error) {
        console.error('Regenerate API key error:', error);
        res.status(500).json({ error: 'Failed to regenerate API key' });
    }
});

module.exports = router;
