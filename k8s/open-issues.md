# Open engineering issues (verified 2026-07-26)

> Re-verified against current code as part of archiving the stale
> [`k8s/archive/issues-2026-03-audit.md`](archive/issues-2026-03-audit.md) audit. Only items
> confirmed still open are listed here.

## 1 — `queueManager.ts` reads `REDIS_URL` from `process.env` directly instead of validated config

**Area:** `backend/src/queues/queueManager.ts` (lines ~42, 70-71)
**Priority:** Low

`redisClient` and the connection options are built from `process.env.REDIS_URL` directly, bypassing the zod-validated `config` object already imported at the top of the file (used elsewhere, e.g. `rateLimit.ts` uses `getRedisConnection` from `../config/runtime`). This risks drift if the env var is renamed or validation rules change.

**Suggested fix:** Source the Redis connection string from `config`/`getRedisConnection` instead of `process.env` directly.

## 2 — Production image is not digest-pinned

**Area:** `k8s/overlays/prod/kustomization.yaml`

The prod overlay pins the image tag via `kustomize edit set image ...:<git-sha>` (a CI convention), but there's no `imagePullPolicy: Always` or enforced digest (`@sha256:...`) pinning, so a tag can still be mutated after push.

**Suggested fix:** Pin by digest in the CI step that sets the image, or set `imagePullPolicy: Always` on the container as a stopgap.

## 3 — `authMiddleware.ts` and `authenticate.ts` remain separate, overlapping auth middlewares

**Area:** `backend/src/middleware/authMiddleware.ts`, `backend/src/middleware/authenticate.ts`

Both files still exist with similar JWT-verification responsibilities.

**Suggested fix:** Consolidate into a single middleware, or document why both are intentionally kept (e.g. different auth strategies) if consolidation isn't desired.

## 4 — `backend/src/modules/` and `backend/src/routes/` both contain business logic

**Area:** `backend/src/modules/`, `backend/src/routes/`

Both directories still hold business logic side by side.

**Suggested fix:** Either confirm this split is an intentional architectural convention (e.g. modules = domain logic, routes = thin route registration) and document it, or migrate remaining logic out of `routes/`.
