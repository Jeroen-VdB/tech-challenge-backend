import { Plugin } from '@hapi/hapi'
import { health } from './health'
import { v0 } from './v0'
import { docs } from './docs'

export const plugins: Plugin<void>[] = [
  health,
  v0,
  docs,
]
