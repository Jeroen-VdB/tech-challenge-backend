import { ServerRoute } from '@hapi/hapi'
import { readFileSync } from 'fs'
import { join } from 'path'

export const docsRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/openapi.yml',
    handler: async (_request, h) => {
      try {
        const filePath = join(__dirname, '../../../doc/openapi.yml')
        const content = readFileSync(filePath, 'utf8')
        return h.response(content).type('application/x-yaml')
      } catch (error) {
        return h.response({ error: 'OpenAPI specification not found' }).code(404)
      }
    }
  },
  {
    method: 'GET',
    path: '/v0/openapi.yml',
    handler: async (_request, h) => {
      try {
        const filePath = join(__dirname, '../../../doc/v0/openapi.yml')
        const content = readFileSync(filePath, 'utf8')
        return h.response(content).type('application/x-yaml')
      } catch (error) {
        return h.response({ error: 'OpenAPI v0 specification not found' }).code(404)
      }
    }
  }
]