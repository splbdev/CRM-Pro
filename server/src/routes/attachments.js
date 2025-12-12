const express = require('express');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const storageService = require('../utils/storage');
const path = require('path');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../uploads');
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const filename = storageService.generateFilename(file.originalname);
        cb(null, filename);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (storageService.isValidFileType(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// Upload file
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { entityType, entityId } = req.body;

        if (!entityType || !entityId) {
            // Delete uploaded file if validation fails
            await storageService.deleteFile(req.file.filename);
            return res.status(400).json({ error: 'entityType and entityId are required' });
        }

        const attachment = await prisma.attachment.create({
            data: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                entityType,
                entityId,
                uploadedBy: req.user.id
            }
        });

        res.status(201).json(attachment);
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up file if database save fails
        if (req.file) {
            await storageService.deleteFile(req.file.filename);
        }
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Get attachments for an entity
router.get('/entity/:entityType/:entityId', authMiddleware, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        const attachments = await prisma.attachment.findMany({
            where: {
                entityType,
                entityId
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json(attachments);
    } catch (error) {
        console.error('Get attachments error:', error);
        res.status(500).json({ error: 'Failed to fetch attachments' });
    }
});

// Download file
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: req.params.id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        const filePath = storageService.getFilePath(attachment.filename);
        const exists = await storageService.fileExists(attachment.filename);

        if (!exists) {
            return res.status(404).json({ error: 'File not found on disk' });
        }

        res.download(filePath, attachment.originalName);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Failed to download file' });
    }
});

// Delete attachment
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const attachment = await prisma.attachment.findUnique({
            where: { id: req.params.id }
        });

        if (!attachment) {
            return res.status(404).json({ error: 'Attachment not found' });
        }

        // Delete file from disk
        await storageService.deleteFile(attachment.filename);

        // Delete from database
        await prisma.attachment.delete({
            where: { id: req.params.id }
        });

        res.json({ message: 'Attachment deleted successfully' });
    } catch (error) {
        console.error('Delete attachment error:', error);
        res.status(500).json({ error: 'Failed to delete attachment' });
    }
});

module.exports = router;
