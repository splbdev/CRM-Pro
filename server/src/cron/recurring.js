const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const reminderService = require('../services/reminder');

const prisma = new PrismaClient();

function calculateNextRun(frequency, fromDate = new Date()) {
    switch (frequency) {
        case 'WEEKLY':
            return new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        case 'MONTHLY':
            return new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, fromDate.getDate());
        case 'ANNUAL':
            return new Date(fromDate.getFullYear() + 1, fromDate.getMonth(), fromDate.getDate());
        default:
            return new Date(fromDate.getFullYear(), fromDate.getMonth() + 1, fromDate.getDate());
    }
}

async function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
        where: { number: { startsWith: `INV-${year}` } }
    });
    return `INV-${year}-${String(count + 1).padStart(4, '0')}`;
}

async function processRecurringInvoices() {
    console.log('[CRON] Processing recurring invoices...');

    try {
        const now = new Date();

        // Find all recurring invoices that are due
        const dueInvoices = await prisma.invoice.findMany({
            where: {
                isRecurring: true,
                nextRun: { lte: now }
            },
            include: { client: true }
        });

        console.log(`[CRON] Found ${dueInvoices.length} recurring invoices to process`);

        for (const invoice of dueInvoices) {
            try {
                const newNumber = await generateInvoiceNumber();

                // Create new invoice
                await prisma.invoice.create({
                    data: {
                        clientId: invoice.clientId,
                        number: newNumber,
                        date: new Date(),
                        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        status: 'SENT',
                        items: invoice.items,
                        total: invoice.total,
                        currency: invoice.currency,
                        isRecurring: false // The new invoice is not recurring itself
                    }
                });

                // Update the recurring invoice's next run
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        nextRun: calculateNextRun(invoice.frequency)
                    }
                });

                console.log(`[CRON] Created recurring invoice ${newNumber} for client ${invoice.client?.name}`);
            } catch (err) {
                console.error(`[CRON] Failed to process invoice ${invoice.id}:`, err);
            }
        }
    } catch (error) {
        console.error('[CRON] Error processing recurring invoices:', error);
    }
}

// Process overdue invoices and update their status
async function processOverdueInvoices() {
    console.log('[CRON] Checking for overdue invoices...');

    try {
        const now = new Date();

        // Find all SENT invoices that are past due date
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: 'SENT',
                dueDate: { lt: now }
            },
            include: { client: true }
        });

        console.log(`[CRON] Found ${overdueInvoices.length} overdue invoices`);

        for (const invoice of overdueInvoices) {
            try {
                // Update to OVERDUE status
                await prisma.invoice.update({
                    where: { id: invoice.id },
                    data: { status: 'OVERDUE' }
                });

                // Log the reminder (in production, this would send email/SMS via messaging)
                console.log(`[CRON] Marked invoice ${invoice.number} as OVERDUE for client ${invoice.client?.name}`);

                // Create audit log entry
                await prisma.auditLog.create({
                    data: {
                        userId: 'SYSTEM',
                        action: 'UPDATE',
                        entity: 'Invoice',
                        entityId: invoice.id,
                        details: {
                            type: 'STATUS_CHANGE',
                            from: 'SENT',
                            to: 'OVERDUE',
                            reason: 'Past due date',
                            clientEmail: invoice.client?.email
                        }
                    }
                });
            } catch (err) {
                console.error(`[CRON] Failed to process overdue invoice ${invoice.id}:`, err);
            }
        }
    } catch (error) {
        console.error('[CRON] Error processing overdue invoices:', error);
    }
}

// Check for tasks due soon and log reminders
async function processTaskReminders() {
    console.log('[CRON] Checking for task reminders...');

    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        // Find pending tasks due tomorrow or earlier
        const dueTasks = await prisma.task.findMany({
            where: {
                status: { not: 'COMPLETED' },
                dueDate: { lte: tomorrow }
            },
            include: {
                client: { select: { name: true } },
                assignee: { select: { name: true, email: true } }
            }
        });

        console.log(`[CRON] Found ${dueTasks.length} tasks due soon`);

        for (const task of dueTasks) {
            console.log(`[CRON] Task reminder: "${task.title}" due ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'} (assigned to ${task.assignee?.name || 'unassigned'})`);
        }
    } catch (error) {
        console.error('[CRON] Error processing task reminders:', error);
    }
}

function startCronJobs() {
    // Run every day at 1:00 AM - recurring invoices
    cron.schedule('0 1 * * *', processRecurringInvoices);

    // Run every day at 9:00 AM - overdue invoice check and reminders
    cron.schedule('0 9 * * *', async () => {
        await processOverdueInvoices();
        await reminderService.checkOverdueInvoices();
        await reminderService.checkDueSoonInvoices();
    });

    // Run every day at 8:00 AM - task reminders
    cron.schedule('0 8 * * *', processTaskReminders);

    console.log('[CRON] Scheduled jobs started');

    // Also run overdue check on startup after a delay
    setTimeout(processOverdueInvoices, 5000);
}

module.exports = {
    startCronJobs,
    processRecurringInvoices,
    processOverdueInvoices,
    processTaskReminders
};

