# Deployment Guide — Physio On Web

## Prerequisites

- Firebase account with project `onlinept-88280`
- Netlify account connected to GitHub
- GitHub repo: `Pakoladiya/onlinept-frontend`

---

## Step 1: Set Netlify Environment Variables

1. Go to [app.netlify.com](https://app.netlify.com) → your site
2. **Site Settings** → **Environment** → **Environment variables**
3. Add each variable:

| Variable | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | `AIzaSyDHkZDw0ZlXTjuIbrkR0HEHVH5JSbPIawo` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `onlinept-88280.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `onlinept-88280` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `onlinept-88280.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `813812425950` |
| `VITE_FIREBASE_APP_ID` | `1:813812425950:web:95c96d1d6a62c8447c0e4f` |
| `VITE_RAZORPAY_KEY_ID` | *(your Razorpay key, or leave blank)* |

4. Click **Save**
5. Go to **Deploys** → **Trigger deploy** → **Deploy latest**

---

## Step 2: Create Firestore Admin Document

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → project `onlinept-88280`
2. **Firestore Database** → **Start collection**
3. Collection ID: `users`
4. Click **Add document**:
   - Document ID: `jiten` (or your Firebase Auth UID)
   - Add field: `role` | string | `super_admin`
5. Click **Save**

This grants you access to `/admin`, `/saas`, `/saas/settings`, and `/saas/onboarding`.

---

## Step 3: Deploy Firestore Security Rules

1. In Firebase Console → **Firestore** → **Rules** tab
2. Delete existing rules
3. Paste rules from `firestore.rules` (or below)
4. Click **Publish**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /clinics/{clinicId} {
      allow read: if true;
      allow write: if request.auth != null
        && (resource.data.uid == request.auth.uid || resource.data.uid == request.auth.uid);
    }

    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /bookings/{bookingId} {
      allow read: if request.auth != null
        && (resource.data.physioId == request.auth.uid || resource.data.patientId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null
        && (resource.data.physioId == request.auth.uid || resource.data.patientId == request.auth.uid);
    }

    match /patients/{patientId} {
      allow read: if request.auth != null && resource.data.physioId == request.auth.uid;
      allow create: if request.auth != null;
      allow update: if request.auth != null && resource.data.physioId == request.auth.uid;
      allow delete: if false;

      match /hep/{hepId} {
        allow read: if request.auth != null && get(/databases/$(database)/documents/patients/$(patientId)).data.physioId == request.auth.uid;
        allow write: if request.auth != null && get(/databases/$(database)/documents/patients/$(patientId)).data.physioId == request.auth.uid;
      }
    }

    match /blockedSlots/{slotId} {
      allow read: if request.auth != null && resource.data.uid == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.uid == request.auth.uid;
      allow delete: if request.auth != null && resource.data.uid == request.auth.uid;
    }
  }
}
```

---

## Step 4: Add Firestore Composite Indexes

1. In Firebase Console → **Firestore** → **Indexes** tab
2. Click **Add index** for each:

| # | Collection ID | Fields |
|---|---|---|
| 1 | `bookings` | physioId (Asc) + date (Asc) |
| 2 | `bookings` | physioId (Asc) + status (Asc) |
| 3 | `bookings` | patientId (Asc) + createdAt (Desc) |
| 4 | `patients` | physioId (Asc) + createdAt (Desc) |
| 5 | `blockedSlots` | uid (Asc) + date (Asc) |

For each: **Add index** → set Collection ID → set Query Scope to **Collection** → add both fields with correct direction → **Create composite index**

---

## Step 5: Connect GitHub for Auto-Deploy (Optional)

1. Go to [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Select **GitHub** → choose `Pakoladiya/onlinept-frontend`
4. Build settings auto-detected from `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Show advanced → Add environment variables (same 7 vars from Step 1)
6. **Deploy site**

After this, every `git push` to GitHub auto-deploys to Netlify.

---

## URLs

| Route | URL |
|---|---|
| Patient Landing | `https://onlinept.in` |
| Booking | `https://onlinept.in/book` |
| Physio Login | `https://onlinept.in/dashboard-login` |
| Physio Dashboard | `https://onlinept.in/dashboard` |
| Physio Settings | `https://onlinept.in/settings` |
| Super Admin | `https://onlinept.in/admin` |
| Clinic Onboarding | `https://onlinept.in/saas/onboarding` |
| Clinic Settings | `https://onlinept.in/saas/settings` |

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| `clinics` | Clinic configs per tenant |
| `users` | User accounts with roles |
| `bookings` | Patient appointments |
| `patients` | Patient records per physio |
| `patients/{id}/hep` | Home exercise plans |
| `blockedSlots` | Physio blocked time slots |

---

## Troubleshooting

**Blank screen after deploy?**
- Check Netlify deploy log for build errors
- Verify environment variables are set correctly
- Check browser console for "useLanguage" or Firebase errors

**"Missing index" errors?**
- Go to Firestore → Indexes → add the missing composite index from Step 4

**Can't access /admin?**
- Verify Firestore doc `users/{yourUid}` has `role: 'super_admin'`
- Check Firebase Auth email matches the logged-in user

**Firebase connection errors?**
- Verify Netlify environment variables match exactly
- Trigger a new deploy after setting env vars
