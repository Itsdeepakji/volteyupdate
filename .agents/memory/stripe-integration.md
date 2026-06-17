---
name: Stripe Integration
description: How Stripe payments are wired into the Voltey checkout flow — key decisions and price unit gotchas.
---

## Price units (critical)
ESIMAccess raw prices (10000ths of USD) → `packages.ts` divides by 100 → **USD cents** on the frontend.
`formatPrice(cents)` divides by 100 to display dollars. So `totalPrice` in Checkout.tsx IS already in USD cents.
Stripe `amount` field expects cents → pass `totalPrice` directly without any conversion.

## Architecture
- `GET /api/stripe/config` — returns publishable key (safe to expose; key is public)
- `POST /api/stripe/create-payment-intent` — creates PI, returns `{clientSecret, paymentIntentId}`
- Frontend: fetches publishable key on Checkout mount, wraps form in `<Elements>`, uses split elements (CardNumberElement/CardExpiryElement/CardCvcElement)
- On submit: create PI → `stripe.confirmCardPayment(clientSecret, {card: cardElement})` → `createOrder` with `paymentIntentId`
- `POST /api/orders` verifies PI status is `succeeded` via Stripe SDK before calling ESIMAccess

**Why:** Verifying PI in the orders route prevents ESIMAccess orders being created without a successful payment, even if someone calls the endpoint directly.

## Key files
- `artifacts/api-server/src/routes/stripe.ts` — Stripe route (config + create PI)
- `artifacts/api-server/src/routes/orders.ts` — verifies `paymentIntentId` if provided (optional field)
- `artifacts/esim-store/src/pages/Checkout.tsx` — split CardElement form, fetchs key from /api/stripe/config
- `lib/api-spec/openapi.yaml` — `paymentIntentId?: string` added to CreateOrderRequest

## ESIMAccess createOrder vs queryOrder (critical gotcha)
- `POST /api/v1/open/esim/order` returns ONLY `{orderNo, transactionId}` — no profiles ever
- Profiles live in `POST /api/v1/open/esim/query` (requires `pager: {pageNum:1,pageSize:20}`) under `obj.esimList`
- These are completely different shapes — `createOrder` uses `packageInfoList`, `queryOrder` uses top-level `esimList`
- Fix: GET /orders re-fetches from ESIMAccess when DB has empty profiles on a completed order; persists to DB

## Env secrets
`STRIPE_SECRET_KEY` (backend) and `STRIPE_PUBLISHABLE_KEY` (served via /api/stripe/config) — both test keys as of June 2026.
