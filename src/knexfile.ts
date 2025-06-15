import type { Knex } from 'knex'

// this file is used either by the API and the `knex` client tool

if(!process.env.API_SQL_SCHEMA)   throw new Error('Missing ENV variable `API_SQL_SCHEMA`.')
if(!process.env.API_SQL_USER)     throw new Error('Missing ENV variable `API_SQL_USER`.')
if(!process.env.API_SQL_PASSWORD) throw new Error('Missing ENV variable `API_SQL_PASSWORD`.')

// Determine if we're using Cloud SQL or a regular connection
const isCloudSQL = process.env.CLOUD_SQL_CONNECTION_NAME || false;
const socketPath = isCloudSQL 
  ? `/cloudsql/${process.env.CLOUD_SQL_CONNECTION_NAME}`
  : undefined;

let connection: any = {}

if (socketPath) {
  // Cloud SQL with unix socket
  connection = {
    socketPath: socketPath,
    database: process.env.API_SQL_SCHEMA,
    user: process.env.API_SQL_USER,
    password: process.env.API_SQL_PASSWORD,
  }
} else {
  // Standard TCP connection
  if(!process.env.API_SQL_HOST) throw new Error('Missing ENV variable `API_SQL_HOST`.')
  if(!process.env.API_SQL_PORT) throw new Error('Missing ENV variable `API_SQL_PORT`.')
  
  connection = {
    host: process.env.API_SQL_HOST,
    port: parseInt(process.env.API_SQL_PORT, 10),
    database: process.env.API_SQL_SCHEMA,
    user: process.env.API_SQL_USER,
    password: process.env.API_SQL_PASSWORD,
  }
}

const knexConfig: Knex.Config = {
  client: 'mysql',
  connection,
  migrations: {
    directory: './db/migrations'
  }
}

export default knexConfig
