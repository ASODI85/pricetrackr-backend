# PriceTrackr Backend

Node.js (Fastify) proxy server for the PriceTrackr Travel Chrome extension.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

## Deploy to Railway

1. Connect this repo to Railway
2. Add env vars from .env.example
3. Generate a public domain in Settings -> Networking
4. Update SUPABASE_URL and DUFFEL_API_KEY in Railway variables

## Health check

GET /health -> { status: 'ok' }