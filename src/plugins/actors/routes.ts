import { ServerRoute } from '@hapi/hapi'
import Joi from 'joi'
import * as lib from '../../lib/actors'
import Boom from '@hapi/boom'

export const actorRoutes: ServerRoute[] = [
  {
    method: 'GET',
    path: '/actors',
    handler: async (_request, h) => {
      const actors = await lib.list()
      return h.response(actors)
    }
  },
  {
    method: 'POST',
    path: '/actors',
    handler: async (request, h) => {
      const actor = request.payload as Omit<lib.Actor, 'id'>
      const id = await lib.create(actor)
      return h.response({
        id,
        path: `/actors/${id}`
      }).code(201)
    },
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().required(),
          bio: Joi.string().required(),
          bornAt: Joi.date().required()
        }).required()
      }
    }
  },
  {
    method: 'GET',
    path: '/actors/{id}',
    handler: async (request, h) => {
      const id = parseInt(request.params.id, 10)
      const actor = await lib.find(id)
      if (!actor) return h.response().code(404)
      return h.response(actor)
    },
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'PUT',
    path: '/actors/{id}',
    handler: async (request, h) => {
      const id = parseInt(request.params.id, 10)
      const actor = request.payload as Partial<Omit<lib.Actor, 'id'>>
      const found = await lib.update(id, actor)
      if (!found) return h.response().code(404)
      return h.response().code(200)
    },
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        }),
        payload: Joi.object({
          name: Joi.string(),
          bio: Joi.string(),
          bornAt: Joi.date()
        }).required()
      }
    }
  },
  {
    method: 'DELETE',
    path: '/actors/{id}',
    handler: async (request, h) => {
      const id = parseInt(request.params.id, 10)
      const found = await lib.remove(id)
      if (!found) return h.response().code(404)
      return h.response().code(204)
    },
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      }
    }  },
  {
    method: 'GET',
    path: '/actors/{id}/movies',
    handler: async (request, h) => {
      const id = parseInt(request.params.id, 10)
      const actorWithMovies = await lib.getMoviesByActor(id)
      if (!actorWithMovies) {
        return Boom.notFound(`Actor with ID ${id} not found`)
      }
      return h.response(actorWithMovies)
    },
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/actors/{actorId}/movies/{movieId}',
    handler: async (request, h) => {
      const actorId = parseInt(request.params.actorId, 10)
      const movieId = parseInt(request.params.movieId, 10)
      
      const success = await lib.addMovieToActor(actorId, movieId)
      if (!success) {
        return Boom.badRequest('Unable to associate actor with movie. Check that both IDs exist and are not already associated.')
      }
      
      return h.response().code(201)
    },
    options: {
      validate: {
        params: Joi.object({
          actorId: Joi.number().integer().required(),
          movieId: Joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'DELETE',
    path: '/actors/{actorId}/movies/{movieId}',
    handler: async (request, h) => {
      const actorId = parseInt(request.params.actorId, 10)
      const movieId = parseInt(request.params.movieId, 10)
      
      const success = await lib.removeMovieFromActor(actorId, movieId)
      if (!success) {
        return Boom.notFound('Association between actor and movie not found')
      }
      
      return h.response().code(204)
    },
    options: {
      validate: {
        params: Joi.object({
          actorId: Joi.number().integer().required(),
          movieId: Joi.number().integer().required()
        })
      }
    }
  },
  {
    method: 'GET',
    path: '/actors/{id}/favorite-genre',
    handler: async (request, h) => {
      const id = parseInt(request.params.id, 10)
      const favoriteGenre = await lib.getFavoriteGenre(id)
      
      if (!favoriteGenre) {
        return Boom.notFound(`Actor with ID ${id} not found or has no movies with genres`)
      }
      
      return h.response(favoriteGenre)
    },
    options: {
      validate: {
        params: Joi.object({
          id: Joi.number().integer().required()
        })
      }
    }
  }
]
