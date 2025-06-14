import * as Lab from '@hapi/lab'
import { expect } from '@hapi/code'
import * as sinon from 'sinon'

import { knex } from '../util/knex'
import { Actor, list, find, remove, create, update } from './actors'

const script = Lab.script as any

export const lab = script()
const { beforeEach, before, after, afterEach, describe, it } = lab

describe('lib', () => describe('actor', () => {
  const sandbox = Object.freeze(sinon.createSandbox())

  const isContext = (value: unknown): value is Context => {
    if(!value || typeof value !== 'object') return false
    const safe = value as Partial<Context>
    if(!safe.stub) return false
    return true
  }
  interface Context {
    stub: Record<string, sinon.SinonStub>
  }
  interface Flags {
    readonly context: Partial<Context>
  }

  before(({context}: Flags) => {
    context.stub = {
      knex_from: sandbox.stub(knex, 'from'),
      knex_select: sandbox.stub(knex, 'select'),
      knex_where: sandbox.stub(knex, 'where'),
      knex_first: sandbox.stub(knex, 'first'),
      knex_delete: sandbox.stub(knex, 'delete'),
      knex_into: sandbox.stub(knex, 'into'),
      knex_insert: sandbox.stub(knex, 'insert'),
      knex_update: sandbox.stub(knex, 'update'),
      console: sandbox.stub(console, 'error'),
    }
  })

  beforeEach(({context}: Flags) => {
    if(!isContext(context)) throw TypeError()

    context.stub.knex_from.returnsThis()
    context.stub.knex_select.returnsThis()
    context.stub.knex_where.returnsThis()
    context.stub.knex_first.returnsThis()
    context.stub.knex_into.returnsThis()
    context.stub.knex_delete.rejects(new Error('test: expectation not provided'))
    context.stub.knex_insert.rejects(new Error('test: expectation not provided'))
    context.stub.knex_update.rejects(new Error('test: expectation not provided'))
  })

  afterEach(() => sandbox.resetHistory())
  after(() => sandbox.restore())

  describe('list', () => {
    it('returns rows from table `actor`', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      await list()
      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'actor')
      sinon.assert.calledOnce(context.stub.knex_select)
    })
  })

  describe('find', () => {
    it('returns one row from table `actor`, by `id`', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      await find(anyId)
      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_where, { id: anyId })
      sinon.assert.calledOnce(context.stub.knex_first)
    })
  })

  describe('remove', () => {
    it('removes one row from table `actor`, by `id`', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      context.stub.knex_delete.resolves()

      await remove(anyId)
      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_where, { id: anyId })
      sinon.assert.calledOnce(context.stub.knex_delete)
    })

    ; [0, 1].forEach( rows =>
      it(`returns ${!!rows} when (${rows}) row is found and deleted`, async ({context}: Flags) => {
        if(!isContext(context)) throw TypeError()

        context.stub.knex_delete.resolves(rows)
        const anyId = 123

        const result = await remove(anyId)
        expect(result).to.be.boolean()
        expect(result).equals(!!rows)
      }))
  })

  describe('create', () => {
    it('inserts one row into table `actor`', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actor: Omit<Actor, 'id'> = {
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      context.stub.knex_insert.resolves([])

      await create(actor)
      sinon.assert.calledOnceWithExactly(context.stub.knex_into, 'actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_insert, actor)
    })

    it('returns the `id` created for the new row', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actor: Omit<Actor, 'id'> = {
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      const anyId = 123
      context.stub.knex_insert.resolves([anyId])

      const result = await create(actor)
      expect(result).to.be.number()
      expect(result).equals(anyId)
    })
  })

  describe('update', () => {
    it('updates one row from table `actor`, by `id` with full actor data', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      const actorUpdate: Partial<Omit<Actor, 'id'>> = {
        name: 'Updated Actor',
        bio: 'Updated Bio',
        bornAt: new Date('1990-02-01')
      }
      context.stub.knex_update.resolves()

      await update(anyId, actorUpdate)
      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_where, { id: anyId })
      sinon.assert.calledOnceWithExactly(context.stub.knex_update, actorUpdate)
    })

    it('updates one row from table `actor`, by `id` with partial actor data', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      const actorUpdate: Partial<Omit<Actor, 'id'>> = {
        name: 'Updated Actor Name'
      }
      context.stub.knex_update.resolves()

      await update(anyId, actorUpdate)
      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_where, { id: anyId })
      sinon.assert.calledOnceWithExactly(context.stub.knex_update, actorUpdate)
    })

    ; [0, 1].forEach( rows =>
      it(`returns ${!!rows} when (${rows}) row is found and updated`, async ({context}: Flags) => {
        if(!isContext(context)) throw TypeError()

        context.stub.knex_update.resolves(rows)
        const anyId = 123

        const result = await update(anyId, { name: 'anything' })
        expect(result).to.be.boolean()
        expect(result).equals(!!rows)
      }))
  })
}))
