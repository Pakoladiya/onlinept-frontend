import { Router } from 'express';
import crypto from 'crypto';

/**
 * Payments Router — Airpay
 *
 * Airpay uses a server-side checksum + HTML form POST redirect flow.
 * Docs: https://airpay.in/developer/
 *
 * Flow:
 *   1. Frontend calls POST /api/payments/create-order  → gets signed params
 *   2. Frontend builds a hidden HTML form and auto-submits to Airpay gateway URL
 *   3. Airpay redirects back to RETURN_URL with payment result
 *   4. Frontend calls POST /api/payments/verify        → backend validates checksum
 *
 * Env vars:
 *   AIRPAY_MERCHANT_ID   — MID from Airpay dashboard (e.g. 359787)
 *   AIRPAY_SECRET_KEY    — API Key from Airpay dashboard (used for HMAC SHA256)
 *   AIRPAY_USERNAME      — Username from Airpay dashboard
 *   AIRPAY_PASSWORD      — Password from Airpay dashboard (MD5-hashed before sending)
 *   AIRPAY_GATEWAY_URL   — https://payments.airpay.co.in/pay/index.php
 *
 * Airpay Checksum Formula (request):
 *   HMAC-SHA256( apiKey, username + password_md5 + currency + isocurrency + privatekey + merchantId + orderAmount + orderId + buyerEmail + buyerPhone )
 *   where privatekey = MD5( username + password_md5 )
 *
 * Airpay Checksum Formula (response/verify):
 *   HMAC-SHA256( apiKey, transactionid + orderid + amount + status )
 */

const router = Router();

// In-memory order store (keyed by orderId)
const orders = new Map();

const AIRPAY_GATEWAY_URL =
  process.env.AIRPAY_GATEWAY_URL ||
  'https://payments.airpay.co.in/pay/index.php';

/**
 * Build Airpay request checksum.
 *
 * Airpay's exact signing string (all values concatenated, no separator):
 *   username + passwordMd5 + currency + isocurrency + privatekey + merchantId + amount + orderId + email + phone
 *
 * where:
 *   passwordMd5  = MD5(plainPassword)
 *   privatekey   = MD5(username + passwordMd5)
 */
function buildRequestChecksum({ apiKey, username, passwordMd5, currency, isocurrency, privatekey, merchantId, amount, orderId, email, phone }) {
  const data = `${username}${passwordMd5}${currency}${isocurrency}${privatekey}${merchantId}${amount}${orderId}${email}${phone}`;
  return crypto.createHmac('sha256', apiKey).update(data).digest('hex');
}

/**
 * Build Airpay response/verify checksum.
 *   HMAC-SHA256( apiKey, transactionid + orderid + amount + status )
 */
function buildResponseChecksum({ apiKey, transactionid, orderid, amount, status }) {
  const data = `${transactionid}${orderid}${amount}${status}`;
  return crypto.createHmac('sha256', apiKey).update(data).digest('hex');
}

/**
 * POST /api/payments/create-order
 *
 * Body:
 *   bookingId      string   — unique booking reference
 *   amount         number   — amount in INR (rupees, NOT paise)
 *   buyerFirstName string
 *   buyerLastName  string
 *   buyerEmail     string
 *   buyerPhone     string
 *   returnUrl      string   — where Airpay redirects after payment
 *
 * Response (real mode):
 *   { gatewayUrl, params }  — params is an object of all form fields to POST to gatewayUrl
 *
 * Response (mock mode):
 *   { gatewayUrl: null, params: {...}, mode: 'test' }
 */
router.post('/create-order', async (req, res) => {
  const {
    bookingId,
    amount,
    buyerFirstName = 'Patient',
    buyerLastName  = '',
    buyerEmail     = 'patient@onlinept.in',
    buyerPhone     = '9999999999',
    returnUrl,
  } = req.body;

  if (!bookingId || !amount) {
    return res.status(400).json({ error: 'bookingId and amount are required' });
  }

  const isMock =
    !process.env.AIRPAY_MERCHANT_ID ||
    process.env.AIRPAY_MERCHANT_ID === 'PASTE_YOUR_MERCHANT_ID';

  if (isMock) {
    const mockParams = {
      merchantid:    'MOCK_MERCHANT',
      orderid:       `MOCK_${bookingId}_${Date.now()}`,
      currency:      'INR',
      isocurrency:   '356',
      amount:        String(amount),
      buyerfirstname: buyerFirstName,
      buyerlastname:  buyerLastName,
      buyeremail:     buyerEmail,
      buyerphone:     buyerPhone,
      checksum:      'MOCK_CHECKSUM',
    };
    orders.set(mockParams.orderid, { bookingId, status: 'pending', amount });
    return res.json({ gatewayUrl: null, params: mockParams, mode: 'test' });
  }

  const merchantId  = process.env.AIRPAY_MERCHANT_ID;
  const apiKey      = process.env.AIRPAY_SECRET_KEY;   // "API Key" field in Airpay dashboard
  const username    = process.env.AIRPAY_USERNAME;
  const passwordMd5 = crypto.createHash('md5').update(process.env.AIRPAY_PASSWORD || '').digest('hex');
  const privatekey  = crypto.createHash('md5').update(`${username}${passwordMd5}`).digest('hex');

  const currency    = 'INR';
  const isocurrency = '356';
  const orderId     = `${bookingId}_${Date.now()}`;
  const orderAmount = String(Number(amount).toFixed(2));

  const checksum = buildRequestChecksum({
    apiKey,
    username,
    passwordMd5,
    currency,
    isocurrency,
    privatekey,
    merchantId,
    amount: orderAmount,
    orderId,
    email: buyerEmail,
    phone: buyerPhone,
  });

  const params = {
    merchantid:     merchantId,
    orderid:        orderId,
    currency,
    isocurrency,
    amount:         orderAmount,
    buyerfirstname: buyerFirstName,
    buyerlastname:  buyerLastName,
    buyeremail:     buyerEmail,
    buyerphone:     buyerPhone,
    username,
    password:       passwordMd5,
    privatekey,
    checksum,
    ...(returnUrl ? { returnurl: returnUrl } : {}),
  };

  orders.set(orderId, { bookingId, status: 'pending', amount });

  res.json({ gatewayUrl: AIRPAY_GATEWAY_URL, params, orderId });
});

/**
 * POST /api/payments/verify
 *
 * Called after Airpay redirects back to your return URL.
 * Airpay POSTs these fields to returnUrl:
 *   transactionid, orderid, amount, status, checksum, ...
 *
 * Body: all fields Airpay sent to the return URL
 *
 * Response: { verified: boolean, bookingId, status }
 */
router.post('/verify', (req, res) => {
  const {
    transactionid,
    orderid,
    amount,
    status,         // 'SUCCESS' | 'FAILED' | 'PENDING'
    checksum: receivedChecksum,
  } = req.body;

  // Mock verification
  if (orderid && orderid.startsWith('MOCK_')) {
    const order = orders.get(orderid);
    if (order) order.status = 'captured';
    return res.json({ verified: true, bookingId: order?.bookingId, status: 'SUCCESS', mode: 'test' });
  }

  if (!process.env.AIRPAY_SECRET_KEY) {
    return res.status(500).json({ error: 'AIRPAY_SECRET_KEY not configured' });
  }

  // Airpay return checksum = HMAC-SHA256( apiKey, transactionid + orderid + amount + status )
  const expected = buildResponseChecksum({
    apiKey: process.env.AIRPAY_SECRET_KEY,
    transactionid,
    orderid,
    amount,
    status,
  });

  if (expected !== receivedChecksum) {
    console.warn('[Airpay] Checksum mismatch — possible tampering');
    return res.status(400).json({ verified: false, error: 'Invalid checksum' });
  }

  const order = orders.get(orderid);
  if (order) order.status = status === 'SUCCESS' ? 'captured' : 'failed';

  res.json({
    verified: status === 'SUCCESS',
    bookingId: order?.bookingId,
    transactionId: transactionid,
    status,
  });
});

/**
 * POST /api/payments/webhook
 * Airpay server-to-server notification (if enabled in Airpay dashboard).
 * Same payload as the return URL POST.
 */
router.post('/webhook', (req, res) => {
  const { transactionid, orderid, amount, status, checksum: receivedChecksum } = req.body;
  console.log(`[Airpay Webhook] orderid=${orderid} status=${status} txn=${transactionid}`);

  if (process.env.AIRPAY_SECRET_KEY) {
    const expected = buildResponseChecksum({
      apiKey: process.env.AIRPAY_SECRET_KEY,
      transactionid,
      orderid,
      amount,
      status,
    });
    if (expected !== receivedChecksum) {
      console.warn('[Airpay Webhook] Checksum mismatch — ignoring');
      return res.status(400).json({ received: false, error: 'Invalid checksum' });
    }
  }

  switch (status) {
    case 'SUCCESS': {
      const order = orders.get(orderid);
      console.log('[Webhook] Payment success:', transactionid, 'bookingId:', order?.bookingId);
      if (order) order.status = 'captured';
      // TODO: Update Firestore booking status to 'confirmed'
      // TODO: Trigger Zoom meeting creation via /api/zoom/create-meeting
      break;
    }
    case 'FAILED': {
      console.log('[Webhook] Payment failed:', transactionid);
      // TODO: Release slot, update booking status to 'payment_failed'
      break;
    }
    default:
      console.log(`[Webhook] Unhandled status: ${status}`);
  }

  res.json({ received: true });
});

export default router;
