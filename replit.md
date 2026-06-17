# Voltey — eSIM Store

A full-stack eSIM sale web app where travelers can browse 190+ destinations, compare data plans, and purchase eSIMs that are delivered instantly by email.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/esim-store run dev` — run the frontend (port varies)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + wouter
- DB: PostgreSQL + Drizzle ORM (orders table)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Email: Nodemailer via ZeptoMail SMTP
- eSIM API: ESIMAccess (https://api.esimaccess.com)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI contract (source of truth)
- `lib/db/src/schema/orders.ts` — Orders DB table
- `artifacts/api-server/src/lib/esimaccess.ts` — ESIMAccess API client + auth signing
- `artifacts/api-server/src/lib/mailer.ts` — ZeptoMail email service
- `artifacts/api-server/src/routes/destinations.ts` — Destinations list endpoint
- `artifacts/api-server/src/routes/packages.ts` — Packages by location endpoint
- `artifacts/api-server/src/routes/orders.ts` — Order create + query endpoints
- `artifacts/esim-store/src/` — React frontend (pages: Home, Destinations, DestinationDetail, Checkout, OrderSuccess)

## Architecture decisions

- ESIMAccess API pricing: price/retailPrice fields are in units of USD × 10000 (divide by 100 to get USD cents for display)
- Prices shown to customers use `retailPrice` (suggested retail), not the wholesale `price`
- Flag images served from flagcdn.com (free CDN) since ESIMAccess flag paths are relative
- Orders stored in local DB for quick lookup; ESIMAccess API used as fallback for queries
- No payment gateway — order charges drawn from ESIMAccess reseller account balance

## Product

- Landing page with hero, popular destinations, and how-it-works
- Destinations page: 190+ countries/regions with flags, searchable
- Destination detail: plan cards showing data, duration, speed, price
- Checkout: email input, plan summary → creates ESIMAccess order
- Order success: eSIM QR code + installation instructions + email confirmation

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- ESIMAccess price fields: divide by 100 to convert to USD cents (units are 10000ths of USD)
- After adding new DB schema, run `pnpm run typecheck:libs` before typechecking artifacts
- ESIMAccess auth: HMAC-SHA256 of `(accessCode + timestamp)` using secretKey
- SMTP uses TLS port 587 (not SSL 465)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
