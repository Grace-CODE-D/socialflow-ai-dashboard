# AnalyticsPage: real data with sample-data fallback

## Problem

`AnalyticsPage` rendered its entire view (28-day reach, engagement,
follower gain, engagement rate, and all charts) from
`buildDailySeries`/`platformShare` in `src/lib/sampleAnalytics.ts`, a seeded
pseudo-random generator. There was no code path calling a real backend
analytics endpoint, so every user saw identical fabricated numbers with no
indication the data wasn't real.

## What changed

- `AnalyticsPage` now calls `AnalyticsService.getAnalytics({})` (the
  generated client, reachable now that `configureApi()` is wired up — see
  the companion fix in `src/main.tsx`) once on mount.
- If the response looks like real data (a non-empty `series` array and a
  `platformShare` array), it replaces the sample data used for the charts
  and stat tiles.
- If the call fails, returns an unexpected shape, or the app is explicitly
  running with `VITE_DEMO_MODE=true`, the page falls back to the existing
  sample generator instead of breaking.
- Whenever sample data is being shown (initial state, fallback, or demo
  mode), a visible `role="status"` banner reading "Showing sample data —
  connect an account or wait for real analytics to sync." appears above the
  charts. The banner disappears once real data loads successfully.

## Tests

`src/pages/__tests__/AnalyticsPage.test.tsx` covers:
- The real analytics API is called on mount.
- Real data is rendered and the sample-data indicator is hidden when the
  API call succeeds.
- The page falls back to sample data and shows the visible indicator when
  the API call fails.
