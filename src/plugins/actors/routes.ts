import { ServerRoute } from '@hapi/hapi'
import Joi from 'joi'
import * as lib from '../../lib/actors'

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
    }
  }
]
