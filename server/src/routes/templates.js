const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Built-in template presets
const TEMPLATE_PRESETS = {
    MODERN: {
        name: 'Modern',
        description: 'Dark header, gradient accents, contemporary feel',
        style: {
            headerBg: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            headerColor: '#ffffff',
            accentColor: '#0ea5e9',
            bodyBg: '#ffffff',
            bodyColor: '#1f2937',
            fontFamily: "'Inter', sans-serif",
            borderRadius: '12px',
            shadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
        },
        invoiceTemplate: `<div style="font-family: 'Inter', sans-serif;">
  <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: white; padding: 40px; border-radius: 12px 12px 0 0;">
    {{#if logo}}<img src="{{logo}}" alt="Logo" style="max-height: 60px; margin-bottom: 16px;" />{{/if}}
    <h1 style="margin: 0; font-size: 32px;">INVOICE</h1>
    <p style="margin: 8px 0 0; opacity: 0.8;">{{invoice_number}}</p>
  </div>
  <div style="padding: 40px; background: #fff;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
      <div><strong>Bill To:</strong><br/>{{client_name}}<br/>{{client_email}}</div>
      <div style="text-align: right;"><strong>Date:</strong> {{date}}<br/><strong>Due:</strong> {{due_date}}</div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px;">
      <thead><tr style="background: #f8fafc;"><th style="padding: 12px; text-align: left;">Description</th><th style="padding: 12px; text-align: right;">Qty</th><th style="padding: 12px; text-align: right;">Price</th><th style="padding: 12px; text-align: right;">Total</th></tr></thead>
      <tbody>{{items}}</tbody>
    </table>
    <div style="text-align: right; font-size: 24px; font-weight: 700; color: #0ea5e9;">Total: {{total}}</div>
  </div>
</div>`
    },
    CLEAN: {
        name: 'Clean',
        description: 'Minimal white design, subtle borders, light and airy',
        style: {
            headerBg: '#ffffff',
            headerColor: '#111827',
            accentColor: '#10b981',
            bodyBg: '#ffffff',
            bodyColor: '#374151',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            borderRadius: '8px',
            shadow: 'none',
            border: '1px solid #e5e7eb'
        },
        invoiceTemplate: `<div style="font-family: 'Plus Jakarta Sans', sans-serif; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
  <div style="padding: 32px; border-bottom: 1px solid #e5e7eb;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      {{#if logo}}<img src="{{logo}}" alt="Logo" style="max-height: 48px;" />{{else}}<div></div>{{/if}}
      <div style="text-align: right;"><h1 style="margin: 0; color: #10b981; font-size: 28px;">INVOICE</h1><p style="margin: 4px 0 0; color: #6b7280;">{{invoice_number}}</p></div>
    </div>
  </div>
  <div style="padding: 32px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div><p style="color: #6b7280; margin: 0 0 4px;">Bill To</p><strong>{{client_name}}</strong><br/><span style="color: #6b7280;">{{client_email}}</span></div>
      <div style="text-align: right;"><p style="margin: 0;"><span style="color: #6b7280;">Date:</span> {{date}}</p><p style="margin: 4px 0 0;"><span style="color: #6b7280;">Due:</span> {{due_date}}</p></div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead><tr style="border-bottom: 2px solid #e5e7eb;"><th style="padding: 12px 0; text-align: left; color: #6b7280; font-weight: 500;">Description</th><th style="padding: 12px 0; text-align: right; color: #6b7280; font-weight: 500;">Qty</th><th style="padding: 12px 0; text-align: right; color: #6b7280; font-weight: 500;">Price</th><th style="padding: 12px 0; text-align: right; color: #6b7280; font-weight: 500;">Total</th></tr></thead>
      <tbody>{{items}}</tbody>
    </table>
    <div style="text-align: right; font-size: 20px; font-weight: 600; color: #10b981;">Total: {{total}}</div>
  </div>
</div>`
    },
    PREMIUM: {
        name: 'Premium',
        description: 'Gold accents, elegant typography, luxury feel',
        style: {
            headerBg: '#0c0c0c',
            headerColor: '#d4af37',
            accentColor: '#d4af37',
            bodyBg: '#fafafa',
            bodyColor: '#1a1a1a',
            fontFamily: "'Playfair Display', serif",
            borderRadius: '0',
            shadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        },
        invoiceTemplate: `<div style="font-family: 'Playfair Display', serif; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
  <div style="background: #0c0c0c; color: #d4af37; padding: 48px; text-align: center;">
    {{#if logo}}<img src="{{logo}}" alt="Logo" style="max-height: 70px; margin-bottom: 20px; filter: brightness(0) invert(1);" />{{/if}}
    <h1 style="margin: 0; font-size: 36px; letter-spacing: 8px; font-weight: 400;">INVOICE</h1>
    <p style="margin: 12px 0 0; letter-spacing: 4px; opacity: 0.7;">{{invoice_number}}</p>
  </div>
  <div style="padding: 48px; background: #fafafa;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid #d4af37;">
      <div><p style="color: #888; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 2px; font-size: 12px;">Billed To</p><strong style="font-size: 18px;">{{client_name}}</strong><br/>{{client_email}}</div>
      <div style="text-align: right;"><p style="margin: 0;"><strong>Date:</strong> {{date}}</p><p style="margin: 8px 0 0;"><strong>Due Date:</strong> {{due_date}}</p></div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
      <thead><tr style="border-bottom: 2px solid #0c0c0c;"><th style="padding: 16px 0; text-align: left;">Description</th><th style="padding: 16px 0; text-align: right;">Qty</th><th style="padding: 16px 0; text-align: right;">Price</th><th style="padding: 16px 0; text-align: right;">Total</th></tr></thead>
      <tbody>{{items}}</tbody>
    </table>
    <div style="text-align: right; font-size: 28px; color: #d4af37;">Total: {{total}}</div>
  </div>
</div>`
    },
    CLASSIC: {
        name: 'Classic',
        description: 'Traditional layout, serif fonts, formal look',
        style: {
            headerBg: '#1e3a5f',
            headerColor: '#ffffff',
            accentColor: '#1e3a5f',
            bodyBg: '#ffffff',
            bodyColor: '#333333',
            fontFamily: "'Times New Roman', serif",
            borderRadius: '0',
            shadow: 'none',
            border: '2px solid #1e3a5f'
        },
        invoiceTemplate: `<div style="font-family: 'Times New Roman', serif; border: 2px solid #1e3a5f;">
  <div style="background: #1e3a5f; color: white; padding: 32px;">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      {{#if logo}}<img src="{{logo}}" alt="Logo" style="max-height: 50px;" />{{else}}<div></div>{{/if}}
      <div style="text-align: right;"><h1 style="margin: 0; font-size: 28px;">INVOICE</h1><p style="margin: 4px 0 0;">No. {{invoice_number}}</p></div>
    </div>
  </div>
  <div style="padding: 32px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 32px;">
      <div><strong>Bill To:</strong><br/>{{client_name}}<br/>{{client_email}}</div>
      <div style="text-align: right;"><strong>Invoice Date:</strong> {{date}}<br/><strong>Due Date:</strong> {{due_date}}</div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; border: 1px solid #ddd;">
      <thead><tr style="background: #f5f5f5;"><th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Description</th><th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Qty</th><th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Price</th><th style="padding: 12px; text-align: right; border: 1px solid #ddd;">Total</th></tr></thead>
      <tbody>{{items}}</tbody>
    </table>
    <div style="text-align: right; font-size: 22px; font-weight: bold; color: #1e3a5f;">TOTAL: {{total}}</div>
  </div>
</div>`
    }
};

// Get template presets
router.get('/presets', authMiddleware, async (req, res) => {
    try {
        const presets = Object.entries(TEMPLATE_PRESETS).map(([key, value]) => ({
            id: key,
            name: value.name,
            description: value.description,
            style: value.style
        }));
        res.json(presets);
    } catch (error) {
        console.error('Get presets error:', error);
        res.status(500).json({ error: 'Failed to get presets' });
    }
});

// Apply preset to create template
router.post('/from-preset', authMiddleware, async (req, res) => {
    try {
        const { presetId, type, name, isDefault } = req.body;

        const preset = TEMPLATE_PRESETS[presetId];
        if (!preset) {
            return res.status(400).json({ error: 'Invalid preset' });
        }

        if (isDefault) {
            await prisma.template.updateMany({
                where: { type, isDefault: true },
                data: { isDefault: false }
            });
        }

        const template = await prisma.template.create({
            data: {
                type: type || 'INVOICE',
                name: name || `${preset.name} Template`,
                content: preset.invoiceTemplate,
                style: preset.style,
                category: presetId,
                isDefault: isDefault || false
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Create from preset error:', error);
        res.status(500).json({ error: 'Failed to create template from preset' });
    }
});

// Get all templates
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { type } = req.query;

        const where = type ? { type } : {};

        const templates = await prisma.template.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to get templates' });
    }
});

// Get single template
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const template = await prisma.template.findUnique({
            where: { id: req.params.id }
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Failed to get template' });
    }
});

// Create template
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { type, name, content, style, category, logoUrl, isDefault } = req.body;

        if (!type || !name) {
            return res.status(400).json({ error: 'Type and name are required' });
        }

        // If setting as default, unset other defaults of same type
        if (isDefault) {
            await prisma.template.updateMany({
                where: { type, isDefault: true },
                data: { isDefault: false }
            });
        }

        const template = await prisma.template.create({
            data: {
                type,
                name,
                content: content || '',
                style: style || null,
                category: category || 'CUSTOM',
                logoUrl: logoUrl || null,
                isDefault: isDefault || false
            }
        });

        res.status(201).json(template);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { type, name, content, style, category, logoUrl, isDefault } = req.body;

        const updateData = {};
        if (type) updateData.type = type;
        if (name) updateData.name = name;
        if (content !== undefined) updateData.content = content;
        if (style !== undefined) updateData.style = style;
        if (category) updateData.category = category;
        if (logoUrl !== undefined) updateData.logoUrl = logoUrl;

        if (isDefault !== undefined) {
            if (isDefault) {
                const existing = await prisma.template.findUnique({ where: { id: req.params.id } });
                if (existing) {
                    await prisma.template.updateMany({
                        where: { type: existing.type, isDefault: true },
                        data: { isDefault: false }
                    });
                }
            }
            updateData.isDefault = isDefault;
        }

        const template = await prisma.template.update({
            where: { id: req.params.id },
            data: updateData
        });

        res.json(template);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.template.delete({ where: { id: req.params.id } });
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// Get default template for type
router.get('/default/:type', authMiddleware, async (req, res) => {
    try {
        const template = await prisma.template.findFirst({
            where: { type: req.params.type, isDefault: true }
        });

        if (!template) {
            return res.status(404).json({ error: 'No default template found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Get default template error:', error);
        res.status(500).json({ error: 'Failed to get default template' });
    }
});

module.exports = router;
