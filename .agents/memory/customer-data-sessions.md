---
name: Customer data sessions
description: The authorization rule for customer-owned order and profile data
---

Customer-owned records must derive identity from a signed server session. Client-provided email fields and localStorage are only UI hints or cache data, never authorization.

**Why:** Browser-local identity and query-string filters allowed account history to become device-specific or expose another customer's order details.

**How to apply:** Authenticate at OTP/admin login, use the session identity for customer reads and writes, keep admin reads separately authorized, and use polling or refetch-on-focus when changes must appear across sessions.