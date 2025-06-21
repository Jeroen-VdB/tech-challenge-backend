import knex, { type Knex } from 'knex'
import { logger } from '../util/logger'

if(!process.env.API_SQL_SCHEMA)       throw new Error('Missing ENV variable `API_SQL_SCHEMA`.')
if(!process.env.API_SQL_USER)         throw new Error('Missing ENV variable `API_SQL_USER`.')
if(!process.env.MYSQL_ROOT_PASSWORD)  throw new Error('Missing ENV variable `MYSQL_ROOT_PASSWORD`.')

const API_SQL_SCHEMA: string = process.env.API_SQL_SCHEMA
const API_SQL_USER: string = process.env.API_SQL_USER
const MYSQL_ROOT_PASSWORD: string = process.env.MYSQL_ROOT_PASSWORD

// Determine if we're using Cloud SQL or a regular connection
const isCloudSQL = process.env.CLOUD_SQL_CONNECTION_NAME || false;
const socketPath = isCloudSQL 
  ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
  : undefined;

let connection: any = {}

if (socketPath) {
  // Cloud SQL with unix socket
  connection = {
    socketPath,
    database: undefined, // No database specified when creating it
    user: 'root',
    password: MYSQL_ROOT_PASSWORD,
  }
} else {
  // Standard TCP connection
  if(!process.env.API_SQL_HOST) throw new Error('Missing ENV variable `API_SQL_HOST`.')
  if(!process.env.API_SQL_PORT) throw new Error('Missing ENV variable `API_SQL_PORT`.')
  
  const API_SQL_HOST: string = process.env.API_SQL_HOST
  const API_SQL_PORT: string = process.env.API_SQL_PORT
  
  connection = {
    host: API_SQL_HOST,
    port: parseInt(API_SQL_PORT, 10),
    database: undefined, // No database specified when creating it
    user: 'root',
    password: MYSQL_ROOT_PASSWORD,
  }
}

// create database schema using root user
const knexConfig: Knex.Config = {
  client: 'mysql',
  connection
}

async function createDatabase() {
  const schema = API_SQL_SCHEMA
  const user = API_SQL_USER
  const database = knex(knexConfig)
  
  logger.info('Creating database schema', { schema, user })
  
  await database.raw(`CREATE DATABASE IF NOT EXISTS ${schema};`)
  await database.raw(`GRANT ALL ON ${schema}.* TO '${user}'@'%';`)
  await database.destroy()
  
  logger.info('Database schema created successfully', { schema })
}

process.on('unhandledRejection', (err) => {
  logger.debug('Knex config', { knexConfig })
  logger.error('Unhandled rejection in database creation', err as Error)
  process.exit(1)
})

void createDatabase()
