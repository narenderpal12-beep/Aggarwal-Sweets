---
name: Email & OTP setup
description: Gmail SMTP via nodemailer for OTP login and order notifications — credentials quirks and implementation notes
---

# Gmail SMTP / Nodemailer Setup

**Why:** User wanted real OTP emails and order confirmation emails via their Gmail account.

## Credentials
- Secrets: `GMAIL_USER` (full email, trimmed) and `GMAIL_APP_PASSWORD` (16 chars, spaces stripped)
- Code defensively trims both: `GMAIL_USER.trim()` and `GMAIL_APP_PASSWORD.replace(/\s/g, "")`
- **Critical:** When the user enters credentials via `requestSecrets`, copy-paste artifacts (leading/trailing spaces, bullet chars `·`) have caused `535 BadCredentials` failures. Always add a startup diagnostic log when debugging.

## Implementation
- Email service: `artifacts/api-server/src/lib/email.ts` — `sendOtpEmail()`, `sendOrderEmails()`
- OTP routes: `artifacts/api-server/src/routes/otp.ts` — `POST /auth/otp/send`, `POST /auth/otp/verify`
- OTP table: `otp_codes` in DB (email, code, expiresAt, used, createdAt)
- Order emails: sent asynchronously (non-blocking) in `orders.ts` after insert
- nodemailer is externalized in `build.mjs` (already listed) — just install the package

## OTP Flow
1. `POST /api/auth/otp/send` → generates 6-digit code, saves to DB with 10-min expiry, sends email
2. `POST /api/auth/otp/verify` → validates code (unused + not expired), marks used, returns `{success, email}`
- Frontend `AuthModal` calls these real endpoints (was previously a demo/mock)
- `Checkout` passes `user.email` as `customerEmail` on the order object

## Order Emails
- Customer gets confirmation if `customerEmail` is present on the order
- Admin (`GMAIL_USER`) always gets a notification email
- Both sent via `Promise.allSettled` — one failure doesn't block the other
