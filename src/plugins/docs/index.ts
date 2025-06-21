import { Server, Plugin } from '@hapi/hapi'
import { docsRoutes } from './routes'

export const docs: Plugin<void> = {
  name: 'docs',
  version: '1.0.0',
  multiple: false,
  register: async (server: Server, _options: void) => {
    server.route(docsRoutes);
  }
}