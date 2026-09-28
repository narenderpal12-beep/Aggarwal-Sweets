---
name: Database environment
description: Local and   database configuration uses the uppercase DATABASE_URL variable.
---

The application loads `.env` automatically with dotenv, and the required variable name is uppercase `DATABASE_URL`.

**Why:** Environment variables are case-sensitive, and local `.env` files were previously not loaded by the startup and Drizzle commands.

**How to apply:** On another server, copy `.env.example` to `.env`, set `DATABASE_URL`, and run the npm setup/start commands. Do not use `database_url`.