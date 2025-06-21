import { NodeSDK } from '@opentelemetry/sdk-node'
import { Resource } from '@opentelemetry/resources'
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter'
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter'
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { KnexInstrumentation } from '@opentelemetry/instrumentation-knex'
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston'

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG)
}

const resource = Resource.default().merge(
  new Resource({
    'service.name': process.env.OTEL_SERVICE_NAME || 'tech-challenge-api',
    'service.version': process.env.npm_package_version || '1.0.0',
  })
)

const isProduction = process.env.NODE_ENV === 'production'

// Configure trace exporter
const traceExporter = isProduction 
  ? new TraceExporter()
  : undefined // In development, traces will be logged to console

// Configure metric exporter
const metricExporter = isProduction
  ? new MetricExporter()
  : undefined // In development, metrics will be logged to console

const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader: metricExporter ? new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 60000, // Export metrics every minute
  }) : undefined,
  instrumentations: [
    new HttpInstrumentation({
      requestHook: (span, request) => {
        if ('headers' in request && request.headers) {
          span.setAttribute('http.request.body.size', request.headers['content-length'] || 0)
        }
      },
    }),
    new KnexInstrumentation(),
    new WinstonInstrumentation({
      enabled: true,
      logHook: (span, record) => {
        record['trace_id'] = span.spanContext().traceId
        record['span_id'] = span.spanContext().spanId
      },
    }),
  ],
})

// Gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('OpenTelemetry terminated'))
    .catch((error) => console.log('Error terminating OpenTelemetry', error))
    .finally(() => process.exit(0))
})

sdk.start()
console.log('OpenTelemetry instrumentation initialized')