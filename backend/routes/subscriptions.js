import { Router } from 'express';
import crypto from 'crypto';

/**
 * Subscriptions Router
 * 
 * Handles Razorpay Subscriptions (Recurring Payments).
 * Docs: https://razorpay.com/docs/api/subscriptions/
 */

const router = Router();

let Razorpay;
async function getRazorpay() {
  if (!Razorpay) {
    const mod = await import('razorpay');
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_MOCK';
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'MOCK_SECRET';
    Razorpay = new mod.default({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return Razorpay;
}

/**
 * POST /api/subscriptions/create
 * Body: { planId, clinicId, customerEmail }
 */
router.post('/create', async (req, res) => {
  const { planId, clinicId, customerEmail } = req.body;

  if (!planId || !clinicId) {
    return res.status(400).json({ error: 'planId and clinicId are required' });
  }

  // Handle Mock
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'PASTE_YOUR_KEY_HERE') {
    return res.json({
      subscriptionId: `sub_MOCK_${Date.now()}`,
      mode: 'test',
      keyId: 'rzp_test_MOCK'
    });
  }

  try {
    const rzp = await getRazorpay();
    
    // Create Subscription
    const subscription = await rzp.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 120, // 10 years of monthly billing
      notes: { clinicId },
    });

    res.json({
      subscriptionId: subscription.id,
      amount: subscription.amount, // Not usually sent back for subs, but good for logs
      keyId: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('[Razorpay Sub Error]', err);
    res.status(500).json({ error: err.error?.description || 'Failed to create subscription' });
  }
});

/**
 * POST /api/subscriptions/verify
 * Body: { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature }
 */
router.post('/verify', async (req, res) => {
  const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } = req.body;

  if (!razorpaySubscriptionId || !razorpaySignature) {
    return res.status(400).json({ error: 'Subscription ID and Signature are required' });
  }

  // Mock
  if (razorpaySubscriptionId.startsWith('sub_MOCK_')) {
    return res.json({ verified: true, mode: 'test' });
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
    .digest('hex');

  if (expected !== razorpaySignature) {
    return res.status(400).json({ verified: false, error: 'Invalid subscription signature' });
  }

  res.json({ verified: true });
});

/**
 * POST /api/subscriptions/webhook
 */
router.post('/webhook', (req, res) => {
  const event = req.body.event;
  const payload = req.body.payload;
  console.log(`[Subscription Webhook] Event: ${event}`);

  // TODO: Implement verification of X-Razorpay-Signature here if using in production

  switch (event) {
    case 'subscription.authenticated':
      // The first payment was successful and subscription is now active
      console.log('[Webhook] Subscription authenticated:', payload.subscription.entity.id);
      break;
    case 'subscription.charged':
      // A recurring payment was successful
      console.log('[Webhook] Subscription charged:', payload.payment.entity.id);
      break;
    case 'subscription.cancelled':
      console.log('[Webhook] Subscription cancelled:', payload.subscription.entity.id);
      break;
    case 'subscription.pending':
    case 'subscription.halted':
      console.log('[Webhook] Subscription status change:', event, payload.subscription.entity.id);
      break;
    default:
      console.log(`[Webhook] Unhandled sub event: ${event}`);
  }

  res.json({ received: true });
});

export default router;
