import { Router } from 'express';
import crypto from 'crypto';

/**
 * Payments Router
 *
 * Handles Razorpay order creation, signature verification, and webhook.
 * Docs: https://razorpay.com/docs/api/
 *
 * Env vars:
 *   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET
 */

const router = Router();

// In-memory order store
const orders = new Map();

let Razorpay;
async function getRazorpay() {
  if (!Razorpay) {
    const mod = await import('razorpay');
    Razorpay = new mod.default({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return Razorpay;
}

/**
 * POST /api/payments/create-order
 * Body: { bookingId, amount (paise), currency = 'INR' }
 * If RAZORPAY_KEY_ID is placeholder, returns mock order.
 */
router.post('/create-order', async (req, res) => {
  const { bookingId, amount, currency = 'INR' } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ error: 'bookingId and amount are required' });
  }

  const isMock = !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID === 'PASTE_YOUR_KEY_HERE';

  if (isMock) {
    const mockOrder = {
      orderId: `order_MOCK_${Date.now()}`,
      amount,
      currency,
      keyId: 'rzp_test_MOCK',
    };
    orders.set(mockOrder.orderId, { bookingId, status: 'pending' });
    return res.json({ ...mockOrder, mode: 'test' });
  }

  try {
    const rzp = await getRazorpay();
    const order = await rzp.orders.create({ amount, currency, receipt: `rcpt_${bookingId}`, notes: { bookingId } });
    orders.set(order.id, { bookingId, status: 'pending' });
    res.json({ orderId: order.id, amount: order.amount, currency: order.currency, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('[Razorpay Error]', err.error?.description || err.message);
    res.status(500).json({ error: err.error?.description || 'Failed to create order' });
  }
});

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature using HMAC SHA256.
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId }
 */
router.post('/verify', async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, bookingId } = req.body;

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return res.status(400).json({ error: 'All signature fields are required' });
  }

  // Mock verification for test orders
  if (razorpayOrderId.startsWith('order_MOCK_')) {
    const order = orders.get(razorpayOrderId);
    if (order) order.status = 'captured';
    return res.json({ verified: true, bookingId, mode: 'test' });
  }

  if (!process.env.RAZORPAY_KEY_SECRET) {
    return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET not configured' });
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expected !== razorpaySignature) {
    return res.status(400).json({ verified: false, error: 'Invalid signature' });
  }

  const order = orders.get(razorpayOrderId);
  if (order) order.status = 'captured';

  res.json({ verified: true, bookingId: order?.bookingId || bookingId });
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook — configure in Dashboard → Settings → Webhooks.
 * Requires express.raw parser (configured in server.js).
 */
router.post('/webhook', (req, res) => {
  const event = req.body.event;
  const payload = req.body.payload;
  console.log(`[Razorpay Webhook] Event: ${event}`);

  switch (event) {
    case 'payment.captured': {
      const bookingId = payload?.payment?.entity?.notes?.bookingId;
      console.log('[Webhook] Payment captured:', payload.payment.entity.id, 'bookingId:', bookingId);
      // TODO: Update Firestore booking status to 'confirmed'
      // TODO: Trigger Zoom meeting creation via /api/zoom/create-meeting
      break;
    }
    case 'payment.failed': {
      console.log('[Webhook] Payment failed:', payload.payment.entity.id);
      // TODO: Release slot, update booking status
      break;
    }
    case 'refund.created': {
      console.log('[Webhook] Refund created:', payload.refund.entity.id);
      break;
    }
    default:
      console.log(`[Webhook] Unhandled event: ${event}`);
  }

  res.json({ received: true });
});

export default router;
