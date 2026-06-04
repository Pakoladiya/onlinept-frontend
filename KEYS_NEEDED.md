# Keys & Credentials Needed

## Firebase
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `FIREBASE_PROJECT_ID` (backend)
- `FIREBASE_CLIENT_EMAIL` (backend)
- `FIREBASE_PRIVATE_KEY` (backend)

## Airpay Payment Gateway (backend-only — no frontend key needed)

All Airpay credentials live exclusively in `backend/.env`. Nothing is exposed to the browser.

| Variable | Where to Get | Required For |
|---|---|---|
| `AIRPAY_MERCHANT_ID` | Airpay Merchant Dashboard → Settings → API Credentials | Order creation & checksum |
| `AIRPAY_SECRET_KEY` | Airpay Merchant Dashboard → Settings → API Credentials | HMAC SHA256 checksum signing |
| `AIRPAY_USERNAME` | Airpay Merchant Dashboard → Settings → API Credentials | Gateway authentication |
| `AIRPAY_PASSWORD` | Airpay Merchant Dashboard → Settings → API Credentials | Gateway authentication (MD5-hashed before sending) |
| `AIRPAY_GATEWAY_URL` | Default: `https://payments.airpay.co.in/pay/index.php` | Gateway POST target |

### Mock / Test Mode
Leave all `AIRPAY_*` variables blank (or unset) to run in **mock mode**:
- Backend returns `mode: 'test'` with a fake order
- Frontend skips the gateway redirect and confirms the booking immediately
- No real money is moved — safe for local development and demos

### Payment Flow (Production)
1. Patient clicks "Pay & Confirm" on `/payment/:bookingId`
2. Frontend calls `POST /api/payments/create-order` → backend returns signed Airpay params
3. Frontend auto-submits a hidden HTML form to `AIRPAY_GATEWAY_URL`
4. Patient completes payment on Airpay's hosted page
5. Airpay redirects to `/payment-return/:bookingId` with result params
6. Frontend calls `POST /api/payments/verify` → backend validates HMAC checksum
7. On success: Firestore booking updated to `confirmed`, WhatsApp notification sent, patient redirected to `/confirmation/:id`

## Zoom (Video Meetings)
- `ZOOM_ACCOUNT_ID` (backend)
- `ZOOM_CLIENT_ID` (backend)
- `ZOOM_CLIENT_SECRET` (backend)

## WhatsApp Business Cloud API
- `WHATSAPP_PHONE_ID` (backend)
- `WHATSAPP_ADMIN_TOKEN` (backend)

## Priority Order for Real Keys
1. **Firebase** — needed for dashboard login and all data storage
2. **Airpay** — needed for real payments
3. **Zoom** — needed for real video meetings
4. **WhatsApp** — needed for booking notifications
