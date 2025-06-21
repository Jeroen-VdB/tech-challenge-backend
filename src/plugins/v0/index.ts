import { Server, Plugin } from '@hapi/hapi'
import { actor } from './actors'
import { genre } from './genres'
import { movie } from './movies'

export const v0: Plugin<void> = {
  name: 'api-v0',
  version: '0.1.0',
  multiple: false,
  register: async (server: Server, _options: void) => {
    // Register all v0 plugins with /v0 prefix
    await server.register([actor, genre, movie], {
      routes: {
        prefix: '/v0'
      }
    })
  }
}