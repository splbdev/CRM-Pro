const express = require('express');
const { PrismaClient } = require('@prisma/client');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Demo Stripe configuration (replace with real keys in production)
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_demo_key_for_development';
const STRIPE_ENDPOINT_SECRET = process.env.STRIPE_ENDPOINT_SECRET || 'whsec_demo_secret';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Note: In production, you would initialize Stripe like this:
// const stripe = require('stripe')(STRIPE_SECRET_KEY);

// Create checkout session for invoice payment
router.post('/create-session', async (req, res) => {
    try {
        const { invoiceId } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        if (invoice.status === 'PAID') {
            return res.status(400).json({ error: 'Invoice already paid' });
        }

        // Calculate remaining amount (for partial payments)
        const existingPayments = await prisma.payment.findMany({
            where: {
                invoiceId,
                status: 'COMPLETED'
            }
        });
        const paidAmount = existingPayments.reduce((sum, p) => sum + p.amount, 0);
        const remainingAmount = invoice.total - paidAmount;

        if (remainingAmount <= 0) {
            return res.status(400).json({ error: 'Invoice fully paid' });
        }

        // Demo: Create a mock session (in production, use Stripe API)
        const sessionId = `demo_session_${Date.now()}_${invoiceId}`;

        // Create pending payment record
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount: remainingAmount,
                stripeSessionId: sessionId,
                status: 'PENDING',
                method: 'STRIPE'
            }
        });

        // In production with real Stripe:
        // const session = await stripe.checkout.sessions.create({
        //     payment_method_types: ['card'],
        //     line_items: [{
        //         price_data: {
        //             currency: invoice.currency.toLowerCase(),
        //             product_data: {
        //                 name: `Invoice ${invoice.number}`,
        //                 description: `Payment for invoice ${invoice.number}`
        //             },
        //             unit_amount: Math.round(remainingAmount * 100)
        //         },
        //         quantity: 1
        //     }],
        //     mode: 'payment',
        //     success_url: `${CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        //     cancel_url: `${CLIENT_URL}/payment/cancel?invoice_id=${invoiceId}`,
        //     metadata: { invoiceId, paymentId: payment.id }
        // });

        res.json({
            sessionId,
            paymentId: payment.id,
            amount: remainingAmount,
            // Demo payment URL
            paymentUrl: `${CLIENT_URL}/pay/${invoiceId}?session=${sessionId}`,
            message: 'Demo mode - In production, this would redirect to Stripe Checkout'
        });
    } catch (error) {
        console.error('Payment session error:', error);
        res.status(500).json({ error: 'Failed to create payment session' });
    }
});

// Get payment link for an invoice
router.get('/link/:invoiceId', async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { client: true, payments: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const paidAmount = invoice.payments
            .filter(p => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.amount, 0);

        res.json({
            invoice: {
                id: invoice.id,
                number: invoice.number,
                total: invoice.total,
                paidAmount,
                remainingAmount: invoice.total - paidAmount,
                status: invoice.status,
                client: invoice.client
            },
            paymentUrl: `${CLIENT_URL}/pay/${invoiceId}`
        });
    } catch (error) {
        console.error('Payment link error:', error);
        res.status(500).json({ error: 'Failed to get payment link' });
    }
});

// Webhook handler for Stripe events (in production)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    // In production:
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_ENDPOINT_SECRET);

    // Demo: just acknowledge
    res.json({ received: true });
});

// Get payment history for an invoice
router.get('/invoice/:invoiceId', auth, async (req, res) => {
    try {
        const { invoiceId } = req.params;

        const payments = await prisma.payment.findMany({
            where: { invoiceId },
            orderBy: { createdAt: 'desc' }
        });

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            select: { total: true, status: true }
        });

        const paidAmount = payments
            .filter(p => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.amount, 0);

        res.json({
            payments,
            summary: {
                total: invoice?.total || 0,
                paidAmount,
                remainingAmount: (invoice?.total || 0) - paidAmount,
                invoiceStatus: invoice?.status
            }
        });
    } catch (error) {
        console.error('Payment history error:', error);
        res.status(500).json({ error: 'Failed to fetch payment history' });
    }
});

// Record manual payment
router.post('/manual', auth, async (req, res) => {
    try {
        const { invoiceId, amount, method, notes } = req.body;

        if (!invoiceId || !amount) {
            return res.status(400).json({ error: 'Invoice ID and amount required' });
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { payments: true }
        });

        if (!invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const paidAmount = invoice.payments
            .filter(p => p.status === 'COMPLETED')
            .reduce((sum, p) => sum + p.amount, 0);

        const remainingAmount = invoice.total - paidAmount;

        if (amount > remainingAmount) {
            return res.status(400).json({
                error: `Amount exceeds remaining balance of ${remainingAmount}`
            });
        }

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                amount: parseFloat(amount),
                status: 'COMPLETED',
                method: method || 'MANUAL',
                notes
            }
        });

        // Check if invoice is fully paid
        const newPaidAmount = paidAmount + parseFloat(amount);
        if (newPaidAmount >= invoice.total) {
            await prisma.invoice.update({
                where: { id: invoiceId },
                data: { status: 'PAID' }
            });
        }

        res.json({
            payment,
            invoiceFullyPaid: newPaidAmount >= invoice.total
        });
    } catch (error) {
        console.error('Manual payment error:', error);
        res.status(500).json({ error: 'Failed to record payment' });
    }
});

// Complete demo payment (simulates successful Stripe payment)
router.post('/complete-demo', async (req, res) => {
    try {
        const { paymentId, sessionId } = req.body;

        const payment = await prisma.payment.findFirst({
            where: {
                OR: [
                    { id: paymentId },
                    { stripeSessionId: sessionId }
                ]
            },
            include: { invoice: true }
        });

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.status === 'COMPLETED') {
            return res.status(400).json({ error: 'Payment already completed' });
        }

        // Update payment status
        await prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: 'COMPLETED',
                stripePaymentId: `demo_pi_${Date.now()}`
            }
        });

        // Check if invoice is fully paid
        const allPayments = await prisma.payment.findMany({
            where: {
                invoiceId: payment.invoiceId,
                status: 'COMPLETED'
            }
        });
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0) + payment.amount;

        if (totalPaid >= payment.invoice.total) {
            await prisma.invoice.update({
                where: { id: payment.invoiceId },
                data: { status: 'PAID' }
            });
        }

        res.json({
            success: true,
            message: 'Demo payment completed successfully',
            invoiceFullyPaid: totalPaid >= payment.invoice.total
        });
    } catch (error) {
        console.error('Complete demo payment error:', error);
        res.status(500).json({ error: 'Failed to complete payment' });
    }
});

// Get all payments (admin)
router.get('/', auth, async (req, res) => {
    try {
        const { status, method, limit = 50 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (method) where.method = method;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                invoice: {
                    include: { client: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit)
        });

        res.json(payments);
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ error: 'Failed to fetch payments' });
    }
});

module.exports = router;
