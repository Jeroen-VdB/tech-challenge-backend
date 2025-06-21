import { knex } from '../util/knex'
import { logger } from '../util/logger'

export async function check(): Promise<Record<string, boolean>> {
  const result: Record<string, boolean> = {}
  result['db'] = await checkDb()
  result['http'] = true
  return result
}

async function checkDb(): Promise<boolean> {
  try {
    await knex.raw('SELECT 1 FROM dual;')
    return true
  } catch(er) {
    logger.warn('Database health check failed', er as Error)
    return false
  }
}
