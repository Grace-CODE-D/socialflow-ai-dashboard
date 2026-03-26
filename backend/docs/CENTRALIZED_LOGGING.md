# Centralized Logging — ELK Stack

Structured JSON logs from the application are forwarded to Elasticsearch and visualised in Kibana.

## Architecture

```
Node.js app (winston)
      │
      ├── Console transport        (always on)
      ├── File transport           (production only: logs/error.log, logs/combined.log)
      └── Elasticsearch transport  (when ELASTICSEARCH_URL is set)
                │
                └── Elasticsearch ──► Kibana dashboards
```

## Quick start (local)

```bash
# 1. Start the ELK stack
docker compose -f backend/elk/docker-compose.yml up -d

# 2. Add to backend/.env
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX_PREFIX=socialflow-logs

# 3. Start the backend — logs flow to ES automatically
npm run dev
```

Kibana is available at http://localhost:5601.

## Import dashboards

In Kibana → Stack Management → Saved Objects → Import, upload:

```
backend/elk/kibana/dashboards/socialflow-overview.ndjson
```

This creates:
- "Error Rate Over Time" — line chart filtered to `severity:error`
- "Request Volume" — histogram of all log events

## Log document shape

Every log entry sent to Elasticsearch follows this structure:

```json
{
  "@timestamp": "2024-01-01T00:00:00.000Z",
  "severity": "info",
  "message": "Request completed",
  "fields": {
    "scope": "AuthController",
    "requestId": "abc-123",
    "method": "POST",
    "path": "/api/auth/login",
    "statusCode": 200,
    "durationMs": 42
  },
  "service": {
    "name": "socialflow-backend",
    "environment": "production"
  }
}
```

## Index strategy

Indices are rotated daily: `socialflow-logs-YYYY.MM.DD`.  
Set up an ILM policy in Kibana to roll over / delete old indices automatically.

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `ELASTICSEARCH_URL` | — | Elasticsearch node URL. Unset = ES transport disabled |
| `ELASTICSEARCH_USERNAME` | — | Basic auth username |
| `ELASTICSEARCH_PASSWORD` | — | Basic auth password |
| `ELASTICSEARCH_INDEX_PREFIX` | `socialflow-logs` | Index name prefix |
| `ELASTICSEARCH_TLS_REJECT_UNAUTHORIZED` | `true` | Set `false` for self-signed certs in dev |
| `LOG_LEVEL` | `info` | Minimum log level (`debug`, `info`, `warn`, `error`) |

## Alerting

In Kibana → Stack Management → Rules, create a threshold rule on the `socialflow-logs-*` index:

- Condition: `COUNT of severity:error > 10` in the last 5 minutes
- Action: Slack / email / PagerDuty webhook
