import winston from 'winston'
import { LoggingWinston } from '@google-cloud/logging-winston'
import { trace, context } from '@opentelemetry/api'

const isProduction = process.env.NODE_ENV === 'production'
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

// Create a custom format that includes trace context
const traceFormat = winston.format((info) => {
  const span = trace.getActiveSpan()
  if (span) {
    const spanContext = span.spanContext()
    info['logging.googleapis.com/trace'] = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/traces/${spanContext.traceId}`
    info['logging.googleapis.com/spanId'] = spanContext.spanId
    info['logging.googleapis.com/trace_sampled'] = spanContext.traceFlags === 1
  }
  return info
})

// Format for local development
const localFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : ''
    return `${timestamp} [${level}]: ${message}${metaStr}`
  })
)

// Format for production (structured JSON)
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  traceFormat(),
  winston.format.json()
)

// Configure transports
const transports: winston.transport[] = []

if (isProduction) {
  // In production, use Google Cloud Logging with redirectToStdout
  const loggingWinston = new LoggingWinston({
    redirectToStdout: true,
    useMessageField: true,
    logName: 'tech-challenge-api',
  })
  transports.push(loggingWinston)
} else {
  // In development, use console with pretty formatting
  transports.push(
    new winston.transports.Console({
      format: localFormat,
    })
  )
}

// Create the logger
export const logger = winston.createLogger({
  level: logLevel,
  format: productionFormat,
  defaultMeta: { 
    service: process.env.OTEL_SERVICE_NAME || 'tech-challenge-api',
    version: process.env.npm_package_version || '1.0.0',
  },
  transports,
})

// Create child logger for specific contexts
export function createLogger(context: string) {
  return logger.child({ context })
}

// Helper to log with request context
export function logWithRequest(req: any, level: string, message: string, meta?: any) {
  const requestMeta = {
    method: req.method,
    path: req.path,
    requestId: req.info?.id,
    remoteAddress: req.info?.remoteAddress,
    userAgent: req.headers?.['user-agent'],
    ...meta,
  }
  
  // Extract trace context from headers if present
  const traceHeader = req.headers?.['x-cloud-trace-context']
  if (traceHeader && process.env.GOOGLE_CLOUD_PROJECT) {
    const [traceId] = traceHeader.split('/')
    requestMeta['logging.googleapis.com/trace'] = `projects/${process.env.GOOGLE_CLOUD_PROJECT}/traces/${traceId}`
  }
  
  logger.log(level, message, requestMeta)
}

// Export common logging methods
export const log = {
  error: (message: string, error?: Error | any, meta?: any) => {
    logger.error(message, { error: error?.message || error, stack: error?.stack, ...meta })
  },
  warn: (message: string, meta?: any) => {
    logger.warn(message, meta)
  },
  info: (message: string, meta?: any) => {
    logger.info(message, meta)
  },
  debug: (message: string, meta?: any) => {
    logger.debug(message, meta)
  },
  http: (message: string, meta?: any) => {
    logger.http(message, meta)
  },
}