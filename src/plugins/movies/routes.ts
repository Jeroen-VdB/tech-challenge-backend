import {
  ServerRoute,
  ResponseToolkit,
  Lifecycle,
  RouteOptionsValidate,
  Request
} from '@hapi/hapi'
import joi from 'joi'
// import Boom from '@hapi/boom'

// import * as movies from '../../lib/movies'
// import { isHasCode } from '../../util/types'


interface ParamsId {
  id: number
}
const validateParamsId: RouteOptionsValidate = {
  params: joi.object({
    id: joi.number().required().min(1),
  })
}

interface PayloadMovie {
  name: string
}
const validatePayloadMovie: RouteOptionsValidate = {
  payload: joi.object({
    name: joi.string().required(),
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
  options: { validate: validatePayloadMovie },
},{
  method: 'GET',
  path: '/movies/{id}',
  handler: get,
  options: { validate: validateParamsId },
},{
  method: 'PUT',
  path: '/movies/{id}',
  handler: put,
  options: { validate: {...validateParamsId, ...validatePayloadMovie} },
},{
  method: 'DELETE',
  path: '/movies/{id}',
  handler: remove,
  options: { validate: validateParamsId },
},]


async function getAll(_req: Request, _h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  return [
    { id: 1, name: 'The Shawshank Redemption', genre_id: 1 },
    { id: 2, name: 'The Godfather', genre_id: 2 },
    { id: 3, name: 'Pulp Fiction', genre_id: 3 }
  ]
}

async function get(req: Request, _h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { id } = (req.params as ParamsId)
  
  const dummyMovies = [
    { id: 1, name: 'The Shawshank Redemption', genre_id: 1 },
    { id: 2, name: 'The Godfather', genre_id: 2 },
    { id: 3, name: 'Pulp Fiction', genre_id: 3 }
  ]
  
  const found = dummyMovies.find(movie => movie.id === id)
  return found || { statusCode: 404, error: 'Not Found', message: 'Movie not found' }
}

async function post(req: Request, h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { name } = (req.payload as PayloadMovie)
  
  const newId = 4 // Dummy ID for the new movie
  const result = {
    id: newId,
    name,
    path: `${req.route.path}/${newId}`
  }
  
  return h.response(result).code(201)
}

async function put(req: Request, h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { id } = (req.params as ParamsId)
  const { name } = (req.payload as PayloadMovie)
  
  // For demo purposes, simulating a successful update for all IDs except 999
  if (id !== 999) {
    return h.response().code(204)
  } else {
    return { statusCode: 404, error: 'Not Found', message: 'Movie not found' }
  }
}

async function remove(req: Request, h: ResponseToolkit, _err?: Error): Promise<Lifecycle.ReturnValue> {
  const { id } = (req.params as ParamsId)
  
  // For demo purposes, simulating a successful deletion for all IDs except 999
  if (id !== 999) {
    return h.response().code(204)
  } else {
    return { statusCode: 404, error: 'Not Found', message: 'Movie not found' }
  }
}
