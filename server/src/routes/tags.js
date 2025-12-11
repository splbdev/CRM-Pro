const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all tags
router.get('/', auth, async (req, res) => {
    try {
        const tags = await prisma.tag.findMany({
            orderBy: { name: 'asc' }
        });
        res.json(tags);
    } catch (error) {
        console.error('Get tags error:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});

// Create tag
router.post('/', auth, async (req, res) => {
    try {
        const { name, color } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Tag name is required' });
        }

        const tag = await prisma.tag.create({
            data: {
                name: name.trim(),
                color: color || '#6366f1'
            }
        });

        res.status(201).json(tag);
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: 'Tag already exists' });
        }
        console.error('Create tag error:', error);
        res.status(500).json({ error: 'Failed to create tag' });
    }
});

// Update tag
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, color } = req.body;

        const tag = await prisma.tag.update({
            where: { id: req.params.id },
            data: { name, color }
        });

        res.json(tag);
    } catch (error) {
        console.error('Update tag error:', error);
        res.status(500).json({ error: 'Failed to update tag' });
    }
});

// Delete tag
router.delete('/:id', auth, async (req, res) => {
    try {
        await prisma.tag.delete({
            where: { id: req.params.id }
        });
        res.json({ message: 'Tag deleted successfully' });
    } catch (error) {
        console.error('Delete tag error:', error);
        res.status(500).json({ error: 'Failed to delete tag' });
    }
});

module.exports = router;
