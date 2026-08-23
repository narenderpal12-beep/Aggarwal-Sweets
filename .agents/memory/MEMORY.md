# Agent Memory Index

- [Admin features scope](admin-features.md) — 9 new admin features added; all implemented with DB persistence
- [Email & OTP setup](email-otp-setup.md) — Gmail SMTP via nodemailer; credential trim is critical; OTP table + routes + order emails all live
- [Post-merge setup](post-merge-setup.md) — npm install, force DB schema push, and root build run through a configured hook
- [Database environment](database-env.md) — local .env loads automatically; the required variable is uppercase DATABASE_URL
- [Admin logo uploads](admin-logo-uploads.md) — Base64 logo uploads need a larger API JSON limit and confirmed save responses.
- [Customer data sessions](customer-data-sessions.md) — customer-owned records must use signed server sessions, not client-supplied identity or browser state alone
