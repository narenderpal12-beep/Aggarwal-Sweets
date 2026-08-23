# Aggarwal Sweets Sirsa

An e-commerce storefront for traditional sweets, namkeen, snacks, and festive
gifting from Aggarwal Sweets in Sirsa. The Node.js server serves the built
storefront and its Express API from the same port.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer

## Setup

1. Install dependencies from the public npm registry:

   ```sh
   npm install
   ```

2. Copy `.env.example` to `.env` and set **`DATABASE_URL`** (uppercase) to a
   PostgreSQL connection string. The application loads `.env` automatically.
   Environment variable names are case-sensitive, so `database_url` will not
   work.

3. Create or update the database tables:

   ```sh
   npm run db:setup
   ```

   This uses Drizzle to apply the existing schema. It does not migrate or
   replace an existing database.

4. Build and start the application:

   ```sh
   npm start
   ```

   The default port is `3000`. Set `PORT` to use another port. `npm start`
   builds the storefront and API bundle before starting the single server.
   `npm run dev` is an alias for the same portable server flow.

Open `http://localhost:3000`. Client-side storefront routes and `/api` are
served by the same process. For a faster development loop, run
`npm run build` after changes and then start the server again.

## Optional email notifications

Set `GMAIL_USER` and `GMAIL_APP_PASSWORD` to enable OTP login emails and order
notifications through Gmail SMTP. Leave both unset to run without outbound
email; the rest of the storefront remains available.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install all workspace dependencies |
| `npm run typecheck` | Typecheck the storefront and API |
| `npm run build` | Typecheck and build the storefront and API |
| `npm run db:setup` | Apply the current PostgreSQL schema |
| `npm start` | Build and serve the storefront and API |
