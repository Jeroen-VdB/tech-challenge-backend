import { script } from '@hapi/lab'
import { expect } from '@hapi/code'
import sinon from 'sinon'

export const lab = script()
const { beforeEach, before, after, afterEach, describe, it } = lab

import * as Hapi from '@hapi/hapi'
import { movie as plugin } from './index'
import * as lib from '../../../lib/movies'

describe('plugin', () => describe('movie', () => {
  const sandbox = Object.freeze(sinon.createSandbox())

  const isContext = (value: unknown): value is Context => {
    if (!value || typeof value !== 'object') return false
    const safe = value as Partial<Context>
    if (!safe.server) return false
    if (!safe.stub) return false
    return true
  }
  interface Context {
    server: Hapi.Server
    stub: Record<string, sinon.SinonStub>
  }
  interface Flags extends script.Flags {
    readonly context: Partial<Context>
  }

  before(async ({ context }: Flags) => {
    context.stub = {
      lib_list: sandbox.stub(lib, 'list'),
      lib_find: sandbox.stub(lib, 'find'),
      lib_remove: sandbox.stub(lib, 'remove'),
      lib_create: sandbox.stub(lib, 'create'),
      lib_update: sandbox.stub(lib, 'update'),
    }

    // all stubs must be made before server starts
    const server = Hapi.server()
    await server.register(plugin)
    await server.start()
    context.server = server
  })

  beforeEach(({ context }: Flags) => {
    if (!isContext(context)) throw TypeError()

    context.stub.lib_list.rejects(new Error('test: provide a mock for the result'))
    context.stub.lib_find.rejects(new Error('test: provide a mock for the result'))
    context.stub.lib_remove.rejects(new Error('test: provide a mock for the result'))
    context.stub.lib_create.rejects(new Error('test: provide a mock for the result'))
    context.stub.lib_update.rejects(new Error('test: provide a mock for the result'))
  })

  afterEach(() => sandbox.resetHistory())
  after(() => sandbox.restore())

  describe('GET /movies', () => {
    const [method, url] = ['GET', '/movies']

    it('returns all movies', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url }
      const anyResult = [{ 'any': 'result' }]
      context.stub.lib_list.resolves(anyResult)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(200)

      sinon.assert.calledOnce(context.stub.lib_list)
      expect(response.result).equals(anyResult)
    })
  })

  describe('POST /movies', () => {
    const [method, url] = ['POST', '/movies']
    const validPayload = {
      name: 'Test Movie',
      synopsis: 'Test synopsis',
      releasedAt: new Date('2025-01-01'),
      runtimeInMinutes: 120,
      genreId: 1
    }

    it('validates payload is not empty', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const payload = undefined
      const opts: Hapi.ServerInjectOptions = { method, url, payload }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('validates payload matches movie schema', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const payload = { 'some': 'object' }
      const opts: Hapi.ServerInjectOptions = { method, url, payload }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('returns HTTP 201, with the id and path to the row created', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const payload = validPayload
      const opts: Hapi.ServerInjectOptions = { method, url, payload }
      const anyResult = 123
      context.stub.lib_create.resolves(anyResult)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(201)

      sinon.assert.calledOnce(context.stub.lib_create)
      expect(response.result).equals({
        id: anyResult,
        path: `/v0/movies/${anyResult}`
      })
    })
  })

  describe('GET /movies/:id', () => {
    const paramId = 123
    const [method, url] = ['GET', `/movies/${paramId}`]

    it('validates :id is numeric', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url: '/movies/not-a-number' }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('returns HTTP 404 when :id is not found', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url }
      context.stub.lib_find.resolves(null)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(404)
    })

    it('returns one movie', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url }
      const anyResult = { 'any': 'result' }
      context.stub.lib_find.resolves(anyResult)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(200)

      sinon.assert.calledOnceWithExactly(context.stub.lib_find, paramId)
      expect(response.result).equals(anyResult)
    })
  })

  describe('PUT /movies/:id', () => {
    const paramId = 123
    const validPayload = {
      name: 'Test Movie',
      synopsis: 'Test synopsis',
      releasedAt: new Date('2025-01-01'),
      runtimeInMinutes: 120,
      genreId: 1
    }
    const [method, url] = ['PUT', `/movies/${paramId}`]

    it('validates payload is not empty', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url, payload: undefined }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })    
    
    it('validates payload matches movie schema', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url, payload: { 'unexpected': 'object' } }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('returns HTTP 404 when :id is not found', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url, payload: validPayload }
      context.stub.lib_update.resolves(false)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(404)
    })

    it('returns HTTP 200 on successful update', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url, payload: validPayload }
      context.stub.lib_update.resolves(true)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(200)

      sinon.assert.calledOnce(context.stub.lib_update)
      expect(response.result).to.not.be.null()
      expect(response.result).to.include({
        id: paramId,
        path: `/movies/${paramId}`,
        name: validPayload.name,
        synopsis: validPayload.synopsis,
        runtimeInMinutes: validPayload.runtimeInMinutes,
        genreId: validPayload.genreId
      })
    })
  })

  describe('DELETE /movies/:id', () => {
    const paramId = 123
    const [method, url] = ['DELETE', `/movies/${paramId}`]

    it('validates :id is numeric', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url: '/movies/not-a-number' }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('returns HTTP 404 when :id is not found', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url }
      context.stub.lib_remove.resolves(false)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(404)
    })

    it('returns HTTP 204 on successful deletion', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      const opts: Hapi.ServerInjectOptions = { method, url }
      context.stub.lib_remove.resolves(true)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(204)

      sinon.assert.calledOnceWithExactly(context.stub.lib_remove, paramId)
      expect(response.result).to.be.null()
    })
  })
}))
