import { Plugin } from '@hapi/hapi'
import { logWithRequest, logger } from '../../util/logger'
import { metrics } from '@opentelemetry/api'

const METER_NAME = 'tech-challenge-api'

interface ObservabilityAppState {
  startTime?: number
}

export const observabilityPlugin: Plugin<void> = {
  name: 'observability',
  version: '1.0.0',
  register: async (server) => {
    // Initialize OpenTelemetry metrics
    const meter = metrics.getMeter(METER_NAME)
    
    // Create metrics
    const httpDuration = meter.createHistogram('http_request_duration_ms', {
      description: 'Duration of HTTP requests in milliseconds',
      unit: 'ms',
    })
    
    const httpRequestTotal = meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
    })
    
    const httpRequestErrors = meter.createCounter('http_request_errors_total', {
      description: 'Total number of HTTP request errors',
    })

    // Log server start
    logger.info('Observability plugin registered')

    // Request lifecycle extension points
    server.ext('onRequest', (request, h) => {
      // Store request start time
      (request.app as ObservabilityAppState).startTime = Date.now()
      
      // Log incoming request
      logWithRequest(request, 'info', 'Incoming request', {
        event: 'request_started',
      })
      
      return h.continue
    })

    server.ext('onPreResponse', (request, h) => {
      const response = request.response as any
      const statusCode = response.statusCode || (response.output && response.output.statusCode) || 200
      const duration = Date.now() - ((request.app as ObservabilityAppState).startTime || Date.now())
      
      // Record metrics
      const labels = {
        method: request.method.toUpperCase(),
        route: request.route?.path || 'unknown',
        status_code: statusCode.toString(),
      }
      
      httpDuration.record(duration, labels)
      httpRequestTotal.add(1, labels)
      
      if (statusCode >= 400) {
        httpRequestErrors.add(1, labels)
      }
      
      // Log response
      const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'
      logWithRequest(request, logLevel, 'Request completed', {
        event: 'request_completed',
        statusCode,
        duration,
        responseSize: response.headers?.['content-length'] || 0,
      })
      
      // Log errors with stack traces
      if (response.isBoom && response.output) {
        logger.error('Request error', {
          error: response.output.payload.message,
          statusCode: response.output.statusCode,
          stack: response.stack,
          path: request.path,
          method: request.method,
        })
      }
      
      return h.continue
    })

    // Handle uncaught errors
    server.events.on('request', (request, event) => {
      if (event.error) {
        const error = event.error as Error
        logger.error('Request error event', {
          error: error.message,
          stack: error.stack,
          tags: event.tags,
          request: {
            id: request.info.id,
            method: request.method,
            path: request.path,
          },
        })
      }
    })

    // Log route registration
    server.events.on('route', (route) => {
      logger.debug('Route registered', {
        method: route.method,
        path: route.path,
        vhost: route.vhost,
      })
    })
  },
}