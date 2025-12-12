const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Only require nodemailer if it's installed
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (err) {
    console.log('[REMINDER] nodemailer not installed - email reminders will be disabled');
}

class ReminderService {
    constructor() {
        this.transporter = this.createTransporter();
    }

    createTransporter() {
        // Only create transporter if nodemailer is available and configured
        if (!nodemailer) {
            console.log('[REMINDER] Email not configured - reminders will be logged only');
            return null;
        }

        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('[REMINDER] SMTP credentials not configured - reminders will be logged only');
            return null;
        }

        // Configure email transporter
        try {
            return nodemailer.createTransporter({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } catch (error) {
            console.error('[REMINDER] Failed to create email transporter:', error);
            return null;
        }
    }

    /**
     * Check and send reminders for overdue invoices
     */
    async checkOverdueInvoices() {
        try {
            const config = await prisma.reminderConfig.findFirst({
                where: {
                    type: 'INVOICE_OVERDUE',
                    enabled: true
                }
            });

            if (!config) {
                console.log('[REMINDER] Overdue invoice reminders not enabled');
                return;
            }

            const daysAfter = config.daysAfter || 1;
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysAfter);

            // Find overdue invoices
            const overdueInvoices = await prisma.invoice.findMany({
                where: {
                    status: { in: ['SENT', 'OVERDUE'] },
                    dueDate: { lt: cutoffDate }
                },
                include: {
                    client: true
                }
            });

            console.log(`[REMINDER] Found ${overdueInvoices.length} overdue invoices`);

            for (const invoice of overdueInvoices) {
                await this.sendInvoiceReminder(invoice, 'INVOICE_OVERDUE', config);
            }

            // Update invoice status to OVERDUE
            if (overdueInvoices.length > 0) {
                await prisma.invoice.updateMany({
                    where: {
                        id: { in: overdueInvoices.map(inv => inv.id) },
                        status: 'SENT'
                    },
                    data: { status: 'OVERDUE' }
                });
            }

            return overdueInvoices.length;
        } catch (error) {
            console.error('[REMINDER] Error checking overdue invoices:', error);
            throw error;
        }
    }

    /**
     * Check and send reminders for invoices due soon
     */
    async checkDueSoonInvoices() {
        try {
            const config = await prisma.reminderConfig.findFirst({
                where: {
                    type: 'INVOICE_DUE_SOON',
                    enabled: true
                }
            });

            if (!config) {
                console.log('[REMINDER] Due soon invoice reminders not enabled');
                return;
            }

            const daysBefore = config.daysBefore || 3;
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + daysBefore);

            // Find invoices due soon
            const dueSoonInvoices = await prisma.invoice.findMany({
                where: {
                    status: 'SENT',
                    dueDate: {
                        gte: startDate,
                        lte: endDate
                    }
                },
                include: {
                    client: true
                }
            });

            console.log(`[REMINDER] Found ${dueSoonInvoices.length} invoices due soon`);

            for (const invoice of dueSoonInvoices) {
                await this.sendInvoiceReminder(invoice, 'INVOICE_DUE_SOON', config);
            }

            return dueSoonInvoices.length;
        } catch (error) {
            console.error('[REMINDER] Error checking due soon invoices:', error);
            throw error;
        }
    }

    /**
     * Send reminder for an invoice
     */
    async sendInvoiceReminder(invoice, type, config) {
        try {
            const channels = config.channels || ['EMAIL'];

            for (const channel of channels) {
                if (channel === 'EMAIL' && invoice.client.email) {
                    await this.sendEmailReminder(invoice, type);
                }
                // SMS can be added here if needed
            }
        } catch (error) {
            console.error(`[REMINDER] Error sending reminder for invoice ${invoice.id}:`, error);
        }
    }

    /**
     * Send email reminder
     */
    async sendEmailReminder(invoice, type) {
        try {
            if (!invoice.client.email) {
                console.log(`[REMINDER] No email for client ${invoice.client.name}`);
                return;
            }

            const subject = type === 'INVOICE_OVERDUE'
                ? `Overdue Invoice Reminder - ${invoice.number}`
                : `Invoice Due Soon - ${invoice.number}`;

            const daysOverdue = type === 'INVOICE_OVERDUE'
                ? Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
                : null;

            const message = type === 'INVOICE_OVERDUE'
                ? `Dear ${invoice.client.name},\n\nThis is a friendly reminder that invoice ${invoice.number} is now ${daysOverdue} days overdue.\n\nInvoice Details:\n- Amount: $${invoice.total.toFixed(2)}\n- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nPlease arrange payment at your earliest convenience.\n\nThank you!`
                : `Dear ${invoice.client.name},\n\nThis is a reminder that invoice ${invoice.number} is due soon.\n\nInvoice Details:\n- Amount: $${invoice.total.toFixed(2)}\n- Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nThank you!`;

            // Only send if transporter is configured
            if (this.transporter) {
                await this.transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: invoice.client.email,
                    subject,
                    text: message
                });

                console.log(`[REMINDER] Email sent to ${invoice.client.email} for invoice ${invoice.number}`);
            } else {
                console.log(`[REMINDER] Email not configured, would send to ${invoice.client.email}`);
                console.log(`[REMINDER] Subject: ${subject}`);
                console.log(`[REMINDER] Message: ${message.substring(0, 100)}...`);
            }

            // Log the reminder
            await prisma.reminderLog.create({
                data: {
                    entityType: 'INVOICE',
                    entityId: invoice.id,
                    type,
                    channel: 'EMAIL',
                    recipient: invoice.client.email,
                    status: this.transporter ? 'SENT' : 'LOGGED'
                }
            });
        } catch (error) {
            console.error('[REMINDER] Email send error:', error);

            // Log failed reminder
            await prisma.reminderLog.create({
                data: {
                    entityType: 'INVOICE',
                    entityId: invoice.id,
                    type,
                    channel: 'EMAIL',
                    recipient: invoice.client.email,
                    status: 'FAILED'
                }
            });
        }
    }

    /**
     * Send manual reminder for a specific invoice
     */
    async sendManualReminder(invoiceId) {
        try {
            const invoice = await prisma.invoice.findUnique({
                where: { id: invoiceId },
                include: { client: true }
            });

            if (!invoice) {
                throw new Error('Invoice not found');
            }

            const type = new Date(invoice.dueDate) < new Date()
                ? 'INVOICE_OVERDUE'
                : 'INVOICE_DUE_SOON';

            await this.sendEmailReminder(invoice, type);

            return { success: true, message: 'Reminder sent successfully' };
        } catch (error) {
            console.error('[REMINDER] Manual reminder error:', error);
            throw error;
        }
    }
}

module.exports = new ReminderService();
