# Real-time Health Monitoring and Alerting

## Overview

This implementation provides real-time health monitoring and alerting for the SocialFlow backend. It continuously monitors critical services (database, Redis, S3, Twitter API, YouTube, Facebook) and sends immediate notifications when issues are detected.

## Features

- **Real-time Health Checks**: Periodic monitoring of all critical services
- **Multi-Provider Alerts**: Support for Slack and PagerDuty notifications
- **Configurable Thresholds**: Set custom alert thresholds for error rates, response times, and consecutive failures
- **Alert Cooldown**: Prevents alert fatigue with configurable cooldown periods
- **REST API**: Query health metrics and configure alerts via HTTP endpoints
- **Graceful Integration**: Seamlessly integrates with existing monitoring infrastructure

## Architecture

### Components

1. **NotificationProvider** (`notificationProvider.ts`)
   - Abstract interface for notification providers
   - Implementations: Slack, PagerDuty
   - Extensible for additional providers

2. **AlertConfigService** (`alertConfigService.ts`)
   - Manages alert thresholds per service
   - Tracks alert cooldown periods
   - Prevents duplicate alerts

3. **HealthMonitor** (`healthMonitor.ts`)
   - Evaluates health metrics against thresholds
   - Triggers alerts when thresholds are exceeded
   - Tracks service status transitions

4. **HealthService** (enhanced `healthService.ts`)
   - Performs health checks on all services
   - Records metrics with the HealthMonitor
   - Tracks consecutive failures

5. **HealthMonitoringJob** (`healthMonitoringJob.ts`)
   - Runs periodic health checks
   - Configurable interval (default: 5 minutes)

## Configuration

### Environment Variables

```env
# Slack webhook URL for health alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# PagerDuty integration key for critical alerts
PAGERDUTY_INTEGRATION_KEY=your-pagerduty-integration-key

# Health check interval in milliseconds (default: 5 minutes)
HEALTH_CHECK_INTERVAL_MS=300000

# Alert thresholds
ALERT_ERROR_RATE_PERCENT=10
ALERT_RESPONSE_TIME_MS=5000
ALERT_CONSECUTIVE_FAILURES=3

# Alert cooldown period in milliseconds (default: 5 minutes)
ALERT_COOLDOWN_MS=300000
```

### Setting Up Slack Notifications

1. Create a Slack App at https://api.slack.com/apps
2. Enable Incoming Webhooks
3. Create a new webhook for your channel
4. Copy the webhook URL to `SLACK_WEBHOOK_URL` in `.env`

### Setting Up PagerDuty Notifications

1. Create a PagerDuty account and service
2. Go to Integrations → Add Integration
3. Select "Events API v2"
4. Copy the Integration Key to `PAGERDUTY_INTEGRATION_KEY` in `.env`

## API Endpoints

### Get System Health Status
```
GET /api/health/status
```
Returns overall system status and individual service health.

**Response:**
```json
{
  "dependencies": {
    "database": { "status": "healthy", "latency": 12, "errorRate": 0.5, "lastChecked": "2026-03-25T17:11:56.453Z" },
    "redis": { "status": "healthy", "latency": 5, "errorRate": 0.1, "lastChecked": "2026-03-25T17:11:56.453Z" },
    "s3": { "status": "healthy", "latency": 18, "errorRate": 0.2, "lastChecked": "2026-03-25T17:11:56.453Z" },
    "twitter": { "status": "healthy", "latency": 52, "errorRate": 1.5, "lastChecked": "2026-03-25T17:11:56.453Z" }
  },
  "overallStatus": "healthy"
}
```

### Get All Health Metrics
```
GET /api/health/metrics
```
Returns detailed metrics for all monitored services.

### Get Service-Specific Metrics
```
GET /api/health/metrics/:service
```
Returns metrics for a specific service (e.g., `database`, `redis`, `s3`, `twitter`).

### Get Alert Configuration
```
GET /api/health/config
```
Returns current alert thresholds for all services.

### Update Alert Configuration
```
PUT /api/health/config/:service
```
Updates alert configuration for a specific service.

**Request Body:**
```json
{
  "enabled": true,
  "thresholds": {
    "errorRatePercent": 15,
    "responseTimeMs": 6000,
    "consecutiveFailures": 5
  },
  "cooldownMs": 600000
}
```

## Alert Types

### Critical Alerts
- Service status changed from healthy to unhealthy
- Error rate exceeds threshold
- Consecutive failures exceed threshold

### Warning Alerts
- Response time exceeds threshold

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Health Check Alert
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Check system health
        run: |
          curl -f http://localhost:3001/api/health/status || exit 1
```

## Monitoring Dashboard

You can create a monitoring dashboard by querying the health endpoints:

```javascript
// Example: Fetch and display health metrics
async function displayHealthDashboard() {
  const response = await fetch('/api/health/metrics');
  const { metrics } = await response.json();
  
  metrics.forEach(metric => {
    console.log(`${metric.service}: ${metric.status}`);
    console.log(`  Latency: ${metric.latency}ms`);
    console.log(`  Error Rate: ${metric.errorRate.toFixed(2)}%`);
    console.log(`  Consecutive Failures: ${metric.consecutiveFailures}`);
  });
}
```

## Troubleshooting

### Alerts Not Sending

1. Verify webhook URLs are correct
2. Check network connectivity to Slack/PagerDuty
3. Review server logs for notification errors
4. Ensure alert cooldown period has passed

### High False Positive Rate

1. Increase `ALERT_ERROR_RATE_PERCENT` threshold
2. Increase `ALERT_RESPONSE_TIME_MS` threshold
3. Increase `ALERT_CONSECUTIVE_FAILURES` threshold
4. Increase `ALERT_COOLDOWN_MS` to reduce alert frequency

### Services Not Being Monitored

1. Verify `HEALTH_CHECK_INTERVAL_MS` is set appropriately
2. Check that health monitoring job started successfully
3. Review server logs for initialization errors

## Future Enhancements

- Email notifications
- SMS alerts via Twilio
- Custom webhook support
- Alert history and analytics
- Service dependency mapping
- Automated remediation actions
- Metrics export to Prometheus/Grafana
