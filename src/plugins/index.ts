import { Plugin } from '@hapi/hapi'
import { observabilityPlugin } from './observability'
import { health } from './health'
import { v0 } from './v0'
import { docs } from './docs'
import { swaggerPlugin } from './swagger'

export const plugins: Plugin<void>[] = [
  observabilityPlugin, // Register first to capture all requests
  health,
  v0,
  docs,
  swaggerPlugin,
]
