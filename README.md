# Anvira — Frontend

Next.js 16 app for **Anvira**, a unified operations platform for Salla merchants.
Hosts the public marketing site, the merchant dashboard, and the Salla OAuth
callback.

**Pairs with**: [`anvira-salla-backend`](https://github.com/medcharaf111/anvira-salla-backend) (Hono + Postgres on Railway).

## Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS v4
- Cairo font for Arabic, Geist for Latin
- RTL by default (`dir="rtl"` on `<html>`)

## Quick start

```bash
npm install
cp .env.example .env.local
# fill in BACKEND_URL etc.
npm run dev
```

Opens on http://localhost:3000.

## Deployment

Vercel: connect this GitHub repo. No build config needed; Vercel auto-detects
Next.js. Set the env vars from `.env.example` in the Vercel dashboard.

## Routes (current)

| Path | Purpose |
|---|---|
| `/` | Marketing landing page (Arabic) |
| `/dashboard` | Merchant dashboard placeholder |
| `/api/auth/salla/callback` | Salla OAuth callback handler |

## Roadmap (per strategic plan)

**v1 (90 days):**
- Salla OAuth + deep sync
- WhatsApp shared inbox + Khaleeji AI smart replies
- Abandoned cart recovery flow
- Basic RBAC + per-user WhatsApp identity

**v2/v3 (deferred):** Visual workflow builder, App Center, Team Chat, Tasks,
sentiment analysis, performance scoring, mobile native app.

## Architecture

```
[Merchant browser]
       ↓
[anvira-salla-frontend (Vercel)]   ← marketing + dashboard + Salla callback
       ↓ REST/WebSocket
[anvira-salla-backend (Railway)]   ← Salla OAuth + WhatsApp Cloud API + AI + DB
       ↓
[Postgres on Railway]
```
