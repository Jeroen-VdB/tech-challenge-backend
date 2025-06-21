import {
  ServerRoute,
  ResponseToolkit,
  Lifecycle,
  RouteOptionsValidate,
  Request,
  ResponseObject
} from '@hapi/hapi'
import joi from 'joi'
import Boom from '@hapi/boom'
import { inspect } from 'util'

import * as movies from '../../../lib/movies'
import { isHasCode } from '../../../util/types'
import { logger } from '../../../util/logger'


interface ParamsId {
  id: number
}

const validateParamsId: RouteOptionsValidate = {
  params: joi.object({
    id: joi.number().required().min(1),
  })
}

interface PayloadMovie {
  id: number,
  name: string,
  synopsis?: string,
  releasedAt: Date,
  runtimeInMinutes: number,
  genreId?: number
}

const validatePayloadMovie: RouteOptionsValidate = {
  payload: joi.object({
    name: joi.string().required(),
    synopsis: joi.string().optional(),
    releasedAt: joi.date().required(),
    runtimeInMinutes: joi.number().required().min(1),
    genreId: joi.number().optional()
  })
}

export const movieRoutes: ServerRoute[] = [{
  method: 'GET',
  path: '/movies',
  handler: getAll,
},{
  method: 'POST',
  path: '/movies',
  handler: post,
  options: { 
    validate: validatePayloadMovie 
  },
},{
  method: 'GET',
  path: '/movies/{id}',
  handler: get,
  options: { validate: validateParamsId },
},{
  method: 'PUT',
  path: '/movies/{id}',
  handler: put,
  options: { 
    validate: {...validateParamsId, ...validatePayloadMovie} 
  },
},{
  method: 'DELETE',
  path: '/movies/{id}',
  handler: remove,
  options: { validate: validateParamsId },
},]


async function getAll(_req: Request, _h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  return movies.list()
}

async function get(req: Request, _h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { id } = (req.params as ParamsId)
  
  const found = await movies.find(id)
  return found || Boom.notFound('Movie not found')
}

async function post(req: Request, h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const movie = req.payload as PayloadMovie
  
  try {
    const id = await movies.create({
      name: movie.name,
      synopsis: movie.synopsis,
      releasedAt: movie.releasedAt,
      runtimeInMinutes: movie.runtimeInMinutes,
      genreId: movie.genreId
    })
      const result = {
      id,
      path: `/v0/movies/${id}`
    }
    return h.response(result).code(201)
  } catch (err) {
    logger.error('Error in POST handler', err as Error);
    throw err;
  }
}

async function put(req: Request, h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { id } = (req.params as ParamsId)
  const movie = req.payload as PayloadMovie
  
  try {
    const updated = await movies.update(id, {
      name: movie.name,
      synopsis: movie.synopsis,
      releasedAt: movie.releasedAt,
      runtimeInMinutes: movie.runtimeInMinutes,
      genreId: movie.genreId
    })
      const result = {
      id,
      path: `/movies/${id}`,
      name: movie.name,
      synopsis: movie.synopsis,
      releasedAt: movie.releasedAt,
      runtimeInMinutes: movie.runtimeInMinutes,
      genreId: movie.genreId
    }
    
    return updated ? h.response(result).code(200) : Boom.notFound('Movie not found')
  } catch (err) {
    logger.error('Error in PUT handler', err as Error);
    throw err;
  }
}

async function remove(req: Request, h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { id } = (req.params as ParamsId)
  
  return await movies.remove(id) ? h.response().code(204) : Boom.notFound('Movie not found')
}
