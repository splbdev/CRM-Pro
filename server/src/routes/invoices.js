const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');

const router = express.Router();
const prisma = new PrismaClient();

// Generate invoice number
async function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
        where: {
            number: { startsWith: `INV-${year}` }
        }
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

// Get all invoices
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { status, clientId, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (clientId) where.clientId = clientId;

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip: (page - 1) * limit,
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
                include: { client: { select: { id: true, name: true, email: true } } }
            }),
            prisma.invoice.count({ where })
        ]);

        res.json({ invoices, total, page: parseInt(page), limit: parseInt(limit) });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ error: 'Failed to get invoices' });
    }
});

// Get single invoice
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { client: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json(invoice);
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ error: 'Failed to get invoice' });
    }
});

// Generate PDF for invoice
router.get('/:id/pdf', authMiddleware, async (req, res) => {
    try {
        const invoice = await prisma.invoice.findUnique({
            where: { id: req.params.id },
            include: { client: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.number}.pdf`);

        // Pipe to response
        doc.pipe(res);

        // Add company header
        doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', 50, 50);
        doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.number}`, 400, 50, { align: 'right' });
        doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, { align: 'right' });
        doc.text(`Due: ${new Date(invoice.dueDate).toLocaleDateString()}`, { align: 'right' });

        // Status badge
        doc.moveDown(2);
        doc.fontSize(12).font('Helvetica-Bold').text(`Status: ${invoice.status}`, 50);

        // Bill To section
        doc.moveDown(1.5);
        doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50);
        doc.fontSize(10).font('Helvetica');
        doc.text(invoice.client?.name || 'N/A');
        if (invoice.client?.email) doc.text(invoice.client.email);
        if (invoice.client?.address) doc.text(invoice.client.address);

        // Items table
        doc.moveDown(2);
        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 280;
        const col3 = 350;
        const col4 = 420;
        const col5 = 490;

        // Table header
        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Description', col1, tableTop);
        doc.text('Qty', col2, tableTop);
        doc.text('Price', col3, tableTop);
        doc.text('Tax', col4, tableTop);
        doc.text('Total', col5, tableTop);

        // Header line
        doc.moveTo(col1, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Items
        doc.font('Helvetica');
        let y = tableTop + 25;
        const items = invoice.items || [];

        items.forEach((item) => {
            const itemTotal = (item.quantity || 1) * (item.price || 0);
            const taxAmount = itemTotal * ((item.tax || 0) / 100);
            const lineTotal = itemTotal + taxAmount;

            doc.text(item.description || '', col1, y, { width: 220 });
            doc.text(String(item.quantity || 1), col2, y);
            doc.text(`$${(item.price || 0).toFixed(2)}`, col3, y);
            doc.text(`${item.tax || 0}%`, col4, y);
            doc.text(`$${lineTotal.toFixed(2)}`, col5, y);

            y += 20;
        });

        // Total line
        doc.moveTo(col1, y + 5).lineTo(550, y + 5).stroke();

        // Total
        y += 20;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Total:', col4, y);
        doc.text(`$${invoice.total.toFixed(2)}`, col5, y);

        // Footer
        doc.fontSize(10).font('Helvetica').text(
            'Thank you for your business!',
            50,
            doc.page.height - 100,
            { align: 'center' }
        );

        // Finalize
        doc.end();
    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// Create invoice
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { clientId, date, dueDate, items, currency, isRecurring, frequency } = req.body;

        if (!clientId || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Client and items are required' });
        }

        // Calculate total
        const total = items.reduce((sum, item) => {
            const itemTotal = (item.quantity || 1) * (item.price || 0);
            const tax = itemTotal * ((item.tax || 0) / 100);
            return sum + itemTotal + tax;
        }, 0);

        const number = await generateInvoiceNumber();

        const invoice = await prisma.invoice.create({
            data: {
                clientId,
                number,
                date: new Date(date || Date.now()),
                dueDate: new Date(dueDate || Date.now() + 30 * 24 * 60 * 60 * 1000),
                items,
                total,
                currency: currency || 'USD',
                isRecurring: isRecurring || false,
                frequency: isRecurring ? frequency : null,
                nextRun: isRecurring ? calculateNextRun(frequency) : null
            },
            include: { client: true }
        });

        res.status(201).json(invoice);
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Update invoice
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { date, dueDate, status, items, currency, isRecurring, frequency } = req.body;

        const updateData = {};
        if (date) updateData.date = new Date(date);
        if (dueDate) updateData.dueDate = new Date(dueDate);
        if (status) updateData.status = status;
        if (currency) updateData.currency = currency;
        if (isRecurring !== undefined) {
            updateData.isRecurring = isRecurring;
            updateData.frequency = isRecurring ? frequency : null;
            updateData.nextRun = isRecurring ? calculateNextRun(frequency) : null;
        }

        if (items && Array.isArray(items)) {
            updateData.items = items;
            updateData.total = items.reduce((sum, item) => {
                const itemTotal = (item.quantity || 1) * (item.price || 0);
                const tax = itemTotal * ((item.tax || 0) / 100);
                return sum + itemTotal + tax;
            }, 0);
        }

        const invoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data: updateData,
            include: { client: true }
        });

        res.json(invoice);
    } catch (error) {
        console.error('Update invoice error:', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// Delete invoice
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.invoice.delete({ where: { id: req.params.id } });
        res.json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        console.error('Delete invoice error:', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

// Mark as paid
router.post('/:id/paid', authMiddleware, async (req, res) => {
    try {
        const invoice = await prisma.invoice.update({
            where: { id: req.params.id },
            data: { status: 'PAID' },
            include: { client: true }
        });
        res.json(invoice);
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ error: 'Failed to mark invoice as paid' });
    }
});

function calculateNextRun(frequency) {
    const now = new Date();
    switch (frequency) {
        case 'WEEKLY':
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'MONTHLY':
            return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        case 'ANNUAL':
            return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        default:
            return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    }
}

module.exports = router;

