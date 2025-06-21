# Observability Guide

This API includes comprehensive observability features using OpenTelemetry and Winston, optimized for both local development and Google Cloud Run deployment.

## Features

### Logging
- **Structured JSON logging** with Winston
- **Automatic trace correlation** with OpenTelemetry
- **Environment-aware formatting** (pretty console for local, JSON for production)
- **Google Cloud Logging integration** with automatic ingestion in Cloud Run

### Metrics
- **HTTP metrics**: Request rate, duration, and error counts
- **Database metrics**: Query performance tracking via Knex instrumentation
- **Custom business metrics**: Easily add your own metrics
- **Google Cloud Monitoring integration** for production

### Tracing
- **Distributed tracing** with OpenTelemetry
- **Automatic span creation** for HTTP requests and database queries
- **Trace context propagation** across services
- **Google Cloud Trace integration** for production visualization

## Local Development

When running locally, logs are formatted for readability:

```bash
npm run dev
```

You'll see colored, structured logs in your console:
```
2024-01-15 10:30:45 [info]: Server running { uri: 'http://localhost:8080', port: '8080' }
2024-01-15 10:30:46 [info]: Incoming request { event: 'request_started', method: 'GET', path: '/health' }
```

## Production Deployment (Google Cloud Run)

In production, logs are automatically structured as JSON and ingested by Cloud Logging:

### Environment Variables

Set these in your Cloud Run service:

```bash
NODE_ENV=production
GOOGLE_CLOUD_PROJECT=your-project-id
LOG_LEVEL=info
OTEL_SERVICE_NAME=tech-challenge-api
```

### Viewing Logs

1. Go to [Cloud Console](https://console.cloud.google.com)
2. Navigate to **Logging → Logs Explorer**
3. Filter by `resource.type="cloud_run_revision"`
4. Logs will include trace IDs for correlation

### Viewing Metrics

1. Go to **Monitoring → Metrics Explorer**
2. Search for your custom metrics (prefixed with service name)
3. Available metrics:
   - `http_request_duration_ms` - Request latency histogram
   - `http_requests_total` - Request counter by method/route/status
   - `http_request_errors_total` - Error counter

### Viewing Traces

1. Go to **Trace → Trace List**
2. Filter by your service name
3. Click on traces to see distributed request flow

## Adding Custom Metrics

```typescript
import { metrics } from '@opentelemetry/api'

const meter = metrics.getMeter('tech-challenge-api')
const movieCounter = meter.createCounter('movies_created_total', {
  description: 'Total number of movies created'
})

// In your code
movieCounter.add(1, { genre: 'action' })
```

## Adding Custom Logs

```typescript
import { logger } from './util/logger'

// Simple logging
logger.info('Movie created', { movieId: 123, genre: 'action' })

// With request context
import { logWithRequest } from './util/logger'
logWithRequest(request, 'info', 'Processing movie creation', { movieId: 123 })
```

## Debugging

Enable OpenTelemetry debug logging:

```bash
OTEL_DEBUG=true npm run dev
```

## Best Practices

1. **Use structured logging**: Always pass metadata as objects
2. **Include context**: Use request IDs and user IDs in logs
3. **Set appropriate levels**: Use error for failures, warn for degraded performance, info for important events
4. **Avoid sensitive data**: Never log passwords, tokens, or PII
5. **Use metrics for trends**: Logs for debugging, metrics for monitoring

## Troubleshooting

### Logs not appearing in Cloud Logging
- Ensure `NODE_ENV=production` is set
- Check that the service account has `roles/logging.logWriter` permission
- Verify `GOOGLE_CLOUD_PROJECT` is set correctly

### Metrics not exporting
- Check that the service account has `roles/monitoring.metricWriter` permission
- Ensure OpenTelemetry SDK is initialized (via --require flag)
- Look for errors in Cloud Run logs

### Traces not correlating
- Verify `X-Cloud-Trace-Context` header is being propagated
- Ensure all services use the same project ID
- Check trace sampling rate configuration