# EngiMart

Ordering platform for engineers and computer-science students in Fayoum who cannot easily get project parts locally. Browse a catalog, place an order, pay a 50% deposit, and the operator sources the parts in Cairo.

## Stack

Next.js (App Router) · Supabase Auth + Postgres + Storage · Fuse.js search

## Setup

1. Create a Supabase project.
2. In the SQL editor, run `supabase/schema.sql`. This creates tables, RLS policies, default fee tiers, a sample catalog, and storage buckets (`product-images`, `transfer-proofs`).
3. Copy `.env.example` to `.env.local`.
4. Fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only)
   - `NEXT_PUBLIC_WHATSAPP_PHONE` — owner number in international format, no `+` (example: `2010xxxxxxx`)
   - `NEXT_PUBLIC_SITE_URL` — `http://localhost:3000` locally, your domain in production
5. Hash the single admin password (never store it in git):

```bash
npm run hash-admin-password -- "your-admin-password"
```

Paste the printed hash into `ADMIN_PASSWORD_HASH`. Escape every `$` as `\$` (Next.js treats `$` as variable interpolation). Set `ADMIN_SESSION_SECRET` to a long random string (32+ characters).

6. In Supabase Authentication, enable Email. Confirm-email can stay off while you are testing.
7. Install and run:

```bash
npm install
npm run dev
```

## Pricing

Stored in `pricing_settings`, editable under the admin pricing page. Defaults:

- Subtotal under 200 EGP → 30 EGP flat
- 200 to 1000 EGP → 12%
- Over 1000 EGP → 8%

The same tiers apply to the cart and to priced custom requests. Checkout always recalculates from the database; the browser is not trusted for prices.

## Admin

There is no public link. Open `/admin` (or a WhatsApp order URL `/admin/orders/{id}`). A single password field unlocks a 3-day session. Approve / decline / product edits / pricing changes are enforced in API routes, not only in the UI.

## Deploy

Vercel is the intended host (HTTPS included). Add the same environment variables there. Set `NEXT_PUBLIC_SITE_URL` to the production origin so WhatsApp messages contain the correct admin order link.
