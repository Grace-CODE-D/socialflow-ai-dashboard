# Fix: backend/.env.example was missing ~38 keys the config schema validates

## Problem

`backend/src/config/config.ts`'s Zod schema requires (non-optional)
`TWITTER_API_KEY`, `TWITTER_API_SECRET`, and `STRIPE_SECRET_KEY` — the
backend throws on boot if any is missing — but none of the three appeared
in `backend/.env.example`. Roughly 30 more keys the schema reads
(`STRIPE_WEBHOOK_SECRET`, `LINKEDIN_*`, `TIKTOK_*`,
`INSTAGRAM_REDIRECT_URI`, `MODERATION_MODE`/`MODERATION_SENSITIVITY`,
`WORKER_MONITOR_*`, `PGBOUNCER_MODE`, `REQUIRE_INTEGRATIONS`,
`ELASTICSEARCH_*`, `LOG_LEVEL`, `BACKEND_PORT`, the
`DATA_RETENTION_*`/`DATA_PRUNING_*` group, `HMAC_TIMESTAMP_TOLERANCE_MS`,
`DYNAMIC_CONFIG_POLL_INTERVAL_MS`, `S3_PRESIGNED_URL_EXPIRY_SECONDS`) were
also entirely absent. Copying `.env.example` to `.env` — the standard
first setup step — produced an opaque `Environment validation failed`
error listing variables a new developer had never seen documented.

## Fix

- Regenerated `backend/.env.example` to include every key referenced by
  the `envSchema` object in `config.ts`, grouped to match the schema's own
  section comments.
- The three required keys (`TWITTER_API_KEY`, `TWITTER_API_SECRET`,
  `STRIPE_SECRET_KEY`) are called out explicitly as `REQUIRED` in their
  section comments.
- Removed a duplicate `NODE_ENV=development` line (it previously appeared
  twice in the file) and consolidated it under a new `Server` section
  alongside `BACKEND_PORT`.
- Added `backend/scripts/check-env-example.js`, wired up as
  `npm run check:env-example` in `backend/package.json`. It parses
  `envSchema`'s declared keys out of `config.ts` and fails with a list of
  any key missing from `.env.example` (commented-out optional overrides
  still count as documented).

## Verifying

```
cd backend
npm run check:env-example
```

Currently reports: `OK — all 73 config.ts keys are documented in .env.example`.
