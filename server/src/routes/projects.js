const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, status } = req.query;

        const where = {};
        if (clientId) where.clientId = clientId;
        if (status) where.status = status;

        const projects = await prisma.project.findMany({
            where,
            include: {
                client: { select: { id: true, name: true } },
                milestones: {
                    orderBy: { dueDate: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate completion percentage for each project
        const projectsWithProgress = projects.map(project => {
            const totalMilestones = project.milestones.length;
            const completedMilestones = project.milestones.filter(m => m.completed).length;
            const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

            return {
                ...project,
                progress: Math.round(progress)
            };
        });

        res.json(projectsWithProgress);
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get single project
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await prisma.project.findUnique({
            where: { id: req.params.id },
            include: {
                client: { select: { id: true, name: true, email: true, phone: true } },
                milestones: {
                    orderBy: { dueDate: 'asc' }
                }
            }
        });

        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }

        // Calculate progress
        const totalMilestones = project.milestones.length;
        const completedMilestones = project.milestones.filter(m => m.completed).length;
        const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

        res.json({
            ...project,
            progress: Math.round(progress)
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({ error: 'Failed to fetch project' });
    }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, clientId, description, status, budget, startDate, endDate, milestones } = req.body;

        if (!name || !clientId) {
            return res.status(400).json({ error: 'Name and client ID are required' });
        }

        const project = await prisma.project.create({
            data: {
                name,
                clientId,
                description: description || null,
                status: status || 'ACTIVE',
                budget: budget ? parseFloat(budget) : null,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                milestones: milestones ? {
                    create: milestones.map(m => ({
                        name: m.name,
                        dueDate: m.dueDate ? new Date(m.dueDate) : null
                    }))
                } : undefined
            },
            include: {
                client: { select: { id: true, name: true } },
                milestones: true
            }
        });

        res.status(201).json(project);
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { name, description, status, budget, startDate, endDate } = req.body;

        const data = {};
        if (name) data.name = name;
        if (description !== undefined) data.description = description || null;
        if (status) data.status = status;
        if (budget !== undefined) data.budget = budget ? parseFloat(budget) : null;
        if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

        const project = await prisma.project.update({
            where: { id: req.params.id },
            data,
            include: {
                client: { select: { id: true, name: true } },
                milestones: true
            }
        });

        res.json(project);
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        // Delete milestones first
        await prisma.milestone.deleteMany({
            where: { projectId: req.params.id }
        });

        await prisma.project.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

// Add milestone to project
router.post('/:id/milestones', authMiddleware, async (req, res) => {
    try {
        const { name, dueDate } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Milestone name is required' });
        }

        const milestone = await prisma.milestone.create({
            data: {
                projectId: req.params.id,
                name,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        res.status(201).json(milestone);
    } catch (error) {
        console.error('Create milestone error:', error);
        res.status(500).json({ error: 'Failed to create milestone' });
    }
});

// Update milestone
router.put('/:projectId/milestones/:milestoneId', authMiddleware, async (req, res) => {
    try {
        const { name, dueDate, completed } = req.body;

        const data = {};
        if (name) data.name = name;
        if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
        if (completed !== undefined) {
            data.completed = completed;
            if (completed) {
                data.completedAt = new Date();
            } else {
                data.completedAt = null;
            }
        }

        const milestone = await prisma.milestone.update({
            where: { id: req.params.milestoneId },
            data
        });

        res.json(milestone);
    } catch (error) {
        console.error('Update milestone error:', error);
        res.status(500).json({ error: 'Failed to update milestone' });
    }
});

// Delete milestone
router.delete('/:projectId/milestones/:milestoneId', authMiddleware, async (req, res) => {
    try {
        await prisma.milestone.delete({
            where: { id: req.params.milestoneId }
        });

        res.json({ message: 'Milestone deleted successfully' });
    } catch (error) {
        console.error('Delete milestone error:', error);
        res.status(500).json({ error: 'Failed to delete milestone' });
    }
});

// Get project statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
    try {
        const [total, byStatus, totalBudget] = await Promise.all([
            prisma.project.count(),
            prisma.project.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.project.aggregate({
                _sum: { budget: true }
            })
        ]);

        res.json({
            total,
            byStatus,
            totalBudget: totalBudget._sum.budget || 0
        });
    } catch (error) {
        console.error('Get project stats error:', error);
        res.status(500).json({ error: 'Failed to fetch project statistics' });
    }
});

module.exports = router;
