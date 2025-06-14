import * as Hapi from '@hapi/hapi'
import * as sinon from 'sinon'
import { expect } from '@hapi/code'
import * as Lab from '@hapi/lab'

import * as lib from '../../lib/actors'
import { actor as plugin } from '.'

const script = Lab.script as any
export const lab = script()
const { beforeEach, before, after, afterEach, describe, it } = lab

describe('plugin', () => describe('actor', () => {
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
  interface Flags {
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

  describe('GET /actors', () => {
    const [method, url] = ['GET', '/actors']

    it('returns all actors', async ({ context }: Flags) => {
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

  describe('POST /actors', () => {
    const [method, url] = ['POST', '/actors']
    const validPayload = {
      name: 'Test Actor',
      bio: 'Test biography',
      bornAt: new Date('1990-01-01')
    }

    it('validates payload is not empty', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const payload = undefined
      const opts: Hapi.ServerInjectOptions = { method, url, payload }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('validates payload matches actor schema', async ({ context }: Flags) => {
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
        path: `/actors/${anyResult}`
      })
    })
  })

  describe('GET /actors/{id}', () => {
    const paramId = 123
    const [method, url] = ['GET', `/actors/${paramId}`]

    it('validates :id is numeric', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const opts: Hapi.ServerInjectOptions = { method, url: '/actors/not-a-number' }

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

    it('returns one actor', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const opts: Hapi.ServerInjectOptions = { method, url }
      const anyResult = { 'any': 'result' }
      context.stub.lib_find.resolves(anyResult)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(200)

      sinon.assert.calledOnce(context.stub.lib_find)
      sinon.assert.calledWithExactly(context.stub.lib_find, paramId)
      expect(response.result).equals(anyResult)
    })
  })

  describe('PUT /actors/{id}', () => {
    const paramId = 123
    const validPayload = {
      name: 'Updated Actor',
      bio: 'Updated bio',
      bornAt: new Date('1990-02-01')
    }
    const [method, url] = ['PUT', `/actors/${paramId}`]

    it('validates payload is not empty', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const payload = undefined
      const opts: Hapi.ServerInjectOptions = { method, url, payload }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('validates payload matches actor schema', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const payload = { 'some': 'object' }
      const opts: Hapi.ServerInjectOptions = { method, url, payload }

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(400)
    })

    it('returns HTTP 404 when :id is not found', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const payload = validPayload
      const opts: Hapi.ServerInjectOptions = { method, url, payload }
      context.stub.lib_update.resolves(false)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(404)
    })

    it('returns HTTP 200 on successful update', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const payload = validPayload
      const opts: Hapi.ServerInjectOptions = { method, url, payload }
      context.stub.lib_update.resolves(true)

      const response = await context.server.inject(opts)
      expect(response.statusCode).equals(200)

      sinon.assert.calledOnce(context.stub.lib_update)
      sinon.assert.calledWithExactly(context.stub.lib_update, paramId, payload)
    })
  })

  describe('DELETE /actors/{id}', () => {
    const paramId = 123
    const [method, url] = ['DELETE', `/actors/${paramId}`]

    it('validates :id is numeric', async ({ context }: Flags) => {
      if (!isContext(context)) throw TypeError()
      
      const opts: Hapi.ServerInjectOptions = { method, url: '/actors/not-a-number' }

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

      sinon.assert.calledOnce(context.stub.lib_remove)
      sinon.assert.calledWithExactly(context.stub.lib_remove, paramId)
    })
  })
}))
