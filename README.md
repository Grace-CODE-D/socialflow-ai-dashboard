# SocialFlow AI Dashboard — Backend

## Environment Variable Setup

All configuration is validated at startup via **Zod** in `src/config/config.ts`.  
If any required variable is missing or has the wrong type the process exits immediately with a clear error listing every failing field.

### Quick start

```bash
cp .env.example .env
# Fill in the required values (see table below), then:
npm run dev
```

### Required variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string — `postgresql://USER:PASS@HOST:PORT/DB` |
| `JWT_SECRET` | Secret used to sign access tokens (min 32 chars recommended) |
| `JWT_REFRESH_SECRET` | Secret used to sign refresh tokens (min 32 chars recommended) |
| `TWITTER_API_KEY` | Twitter / X API key |
| `TWITTER_API_SECRET` | Twitter / X API secret |

### Optional variables with defaults

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `production` \| `test` |
| `BACKEND_PORT` | `3001` | HTTP server port |
| `JWT_EXPIRES_IN` | `15m` | Access token TTL |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | Refresh token TTL |
| `REDIS_HOST` | `127.0.0.1` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_DB` | `0` | Redis database index |
| `REDIS_PASSWORD` | — | Redis password (optional) |
| `LOG_LEVEL` | `info` | `error` \| `warn` \| `info` \| `http` \| `verbose` \| `debug` \| `silly` |
| `OTEL_SERVICE_NAME` | `socialflow-backend` | OpenTelemetry service name |
| `OTEL_EXPORTER` | `jaeger` | `jaeger` \| `honeycomb` \| `otlp` |
| `JAEGER_ENDPOINT` | `http://localhost:14268/api/traces` | Jaeger collector URL |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | `http://localhost:4318/v1/traces` | OTLP endpoint |
| `OTEL_DEBUG` | `false` | Enable verbose OTel diagnostics |
| `DATA_RETENTION_MODE` | `archive` | `archive` \| `delete` |
| `DATA_PRUNING_CRON` | `0 2 * * *` | Cron schedule for data pruning |
| `DATA_RETENTION_LOG_DAYS` | `30` | Log retention in days |
| `DATA_RETENTION_ANALYTICS_DAYS` | `90` | Analytics retention in days |

### Social / third-party integrations (all optional)

| Variable | Description |
|---|---|
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | Facebook Graph API credentials |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | Google OAuth credentials for YouTube |
| `TIKTOK_CLIENT_KEY` / `TIKTOK_CLIENT_SECRET` | TikTok API credentials |
| `DEEPL_API_KEY` | DeepL translation API key |
| `GOOGLE_TRANSLATE_API_KEY` | Google Translate API key |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS API key |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Stripe billing credentials |
| `SLACK_WEBHOOK_URL` | Slack webhook for health alerts |
| `ELASTICSEARCH_URL` | Elasticsearch endpoint for log shipping |

### Validation error example

Starting the server with a missing `JWT_SECRET` produces:

```
Environment validation failed:
  • JWT_SECRET: Invalid input: expected string, received undefined
```

## Running tests

```bash
# All tests
npm test

# Config service only (with coverage)
npx jest --testPathPatterns="config/__tests__/config.test.ts" --coverage --collectCoverageFrom="src/config/config.ts"
```

The config service maintains **100% statement, branch, function, and line coverage**.
