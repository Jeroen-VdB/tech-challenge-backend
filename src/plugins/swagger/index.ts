import { Plugin, ServerRoute } from '@hapi/hapi'
import * as Inert from '@hapi/inert'
import * as Vision from '@hapi/vision'
import { readFileSync } from 'fs'
import { join } from 'path'

export const swaggerPlugin: Plugin<void> = {
  name: 'swagger',
  version: '1.0.0',
  register: async (server) => {
    // Register required plugins for serving static files
    await server.register([Inert, Vision])

    // Helper function to create Swagger UI HTML
    const createSwaggerHTML = (title: string, openapiUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${openapiUrl}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
    `

    // Main documentation route
    const mainDocRoute: ServerRoute = {
      method: 'GET',
      path: '/documentation',
      handler: (_request, h) => {
        const html = createSwaggerHTML('Tech Challenge API Documentation', '/openapi.yml')
        return h.response(html).type('text/html')
      }
    }

    // V0 documentation route
    const v0DocRoute: ServerRoute = {
      method: 'GET',
      path: '/documentation/v0',
      handler: (_request, h) => {
        const html = createSwaggerHTML('Tech Challenge API Documentation - v0', '/v0/openapi.yml')
        return h.response(html).type('text/html')
      }
    }

    server.route([mainDocRoute, v0DocRoute])
  }
}