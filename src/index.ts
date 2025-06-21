import * as Hapi from '@hapi/hapi'
import { plugins } from './plugins'
import { logger } from './util/logger'

const init = async (port = '8080') => {

  const server = Hapi.server({ port })

  await server.register(plugins)
  await server.start()

  logger.info('Server running', { uri: server.info.uri, port })
}

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', err as Error)
  process.exit(1)
})


Object.keys(process.env)
  .filter(it => it.startsWith('API_'))
  .sort()
  .forEach(it => logger.debug(`Environment variable: ${it}=${process.env[it] || '*empty*'}`))

void init(process.env.MT_PORT)
