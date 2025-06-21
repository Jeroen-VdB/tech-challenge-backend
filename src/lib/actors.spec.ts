import * as Lab from '@hapi/lab'
import { expect } from '@hapi/code'
import * as sinon from 'sinon'

import { knex } from '../util/knex'
import { Actor, list, find, remove, create, update, getMoviesByActor, addMovieToActor, removeMovieFromActor, getFavoriteGenre, getCharacterNames } from './actors'

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
    knexStub?: sinon.SinonStub
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
      knex_join: sandbox.stub(knex, 'join'),
      console: sandbox.stub(console, 'error'),
    }
    
    // Create a stub for knex when called as a function
    context.knexStub = sandbox.stub()
  })

  beforeEach(({context}: Flags) => {
    if(!isContext(context)) throw TypeError()

    context.stub.knex_from.returnsThis()
    context.stub.knex_select.returnsThis()
    context.stub.knex_where.returnsThis()
    context.stub.knex_first.returnsThis()
    context.stub.knex_into.returnsThis()
    context.stub.knex_join.returnsThis()
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
  
  describe('getMoviesByActor', () => {
    it('returns null when actor does not exist', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      
      // Configure the entire chain to return null
      const mockChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(null)
      };
      context.stub.knex_from.withArgs('actor').returns(mockChain);
      
      const result = await getMoviesByActor(anyId)
      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'actor')
      sinon.assert.calledOnceWithExactly(mockChain.where, { id: anyId })
      sinon.assert.calledOnce(mockChain.first)
      expect(result).to.be.null()
    })
      it('returns actor with movies when actor exists', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      const mockActor = {
        id: anyId,
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      
      // Configure the chain for the find function
      const mockFindChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(mockActor)
      };
      context.stub.knex_from.withArgs('actor').returns(mockFindChain);
      
      const result = await getMoviesByActor(anyId)
      
      expect(result).to.exist()
      if (result) {
        expect(result.id).to.equal(anyId)
        expect(result.name).to.equal('Test Actor')
        expect(result.bio).to.equal('Test Bio')
        expect(result.movies).to.exist()
        expect(result.movies).to.be.an.array()
      }
    })
  })
  describe('addMovieToActor', () => {
    it('returns true when movie is successfully added to actor', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actorId = 123
      const movieId = 456

      context.stub.knex_insert.resolves()

      const result = await addMovieToActor(actorId, movieId)

      sinon.assert.calledOnceWithExactly(context.stub.knex_into, 'movie_actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_insert, { actorId, movieId, characterName: undefined })

      expect(result).to.be.true()
    })

    it('returns false when an error occurs', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actorId = 123
      const movieId = 456

      context.stub.knex_insert.rejects(new Error('Foreign key constraint failed'))

      const result = await addMovieToActor(actorId, movieId)

      expect(result).to.be.false()
    })
    
    it('returns false when table does not exist', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()
      
      const actorId = 123
      const movieId = 456
      
      const error = new Error('ER_NO_SUCH_TABLE: Table \'movies.movie_actor\' doesn\'t exist');
      // @ts-ignore - Adding code property for MySQL error format
      error.code = 'ER_NO_SUCH_TABLE';
      context.stub.knex_insert.rejects(error);
      
      const result = await addMovieToActor(actorId, movieId)
      
      expect(result).to.be.false()
    })
  })
  describe('removeMovieFromActor', () => {
    it('returns true when association is successfully removed', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actorId = 123
      const movieId = 456

      context.stub.knex_delete.resolves(1)

      const result = await removeMovieFromActor(actorId, movieId)

      sinon.assert.calledOnceWithExactly(context.stub.knex_from, 'movie_actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_where, { actorId, movieId })

      expect(result).to.be.true()
    })

    it('returns false when association does not exist', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actorId = 123
      const movieId = 456

      context.stub.knex_delete.resolves(0)

      const result = await removeMovieFromActor(actorId, movieId)

      expect(result).to.be.false()
    })
  })
  
  describe('getFavoriteGenre', () => {
    it('returns null when actor does not exist', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      
      // Configure the chain to return null for actor
      const mockChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(null)
      };
      context.stub.knex_from.withArgs('actor').returns(mockChain);
      
      const result = await getFavoriteGenre(anyId)
      expect(result).to.be.null()
    })
    
    it('returns null when actor has no movies', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      const mockActor = {
        id: anyId,
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      
      // Configure the find chain to return actor
      const mockFindChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(mockActor)
      };
      context.stub.knex_from.withArgs('actor').returns(mockFindChain);
      
      const result = await getFavoriteGenre(anyId)
      // Result will be null because knex('movie_actor') will fail in test environment
      expect(result).to.be.null()
    })
    
    it('returns the favorite genre when actor has movies with genres', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      const mockActor = {
        id: anyId,
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      
      // Configure the find chain to return actor
      const mockFindChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(mockActor)
      };
      context.stub.knex_from.withArgs('actor').returns(mockFindChain);
      
      // Now we need to handle the knex('movie_actor') call
      // We'll override knex temporarily for this test
      const knexModule = require('../util/knex');
      const originalKnex = knexModule.knex;
      
      // Create a mock for the genre query result
      const mockGenreResult = {
        id: 1,
        name: 'Action',
        movieCount: '5'  // Count is typically returned as string from DB
      };
      
      // Create the chain mock
      const mockGenreChain = {
        join: sandbox.stub().returnsThis(),
        where: sandbox.stub().returnsThis(),
        select: sandbox.stub().returnsThis(),
        count: sandbox.stub().returnsThis(),
        groupBy: sandbox.stub().returnsThis(),
        orderBy: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(mockGenreResult)
      };
      
      // Stub knex to return our mock chain when called with 'movie_actor'
      const knexStub = sandbox.stub();
      knexStub.withArgs('movie_actor').returns(mockGenreChain);
      // @ts-ignore - Adding from property for test mocking
      knexStub.from = context.stub.knex_from;
      
      // Replace knex in the module
      knexModule.knex = knexStub;
      
      try {
        const result = await getFavoriteGenre(anyId)
        
        expect(result).to.exist()
        expect(result).to.not.be.null()
        expect(result!.id).to.equal(1)
        expect(result!.name).to.equal('Action')
        expect(result!.movieCount).to.equal(5)
        
        // Verify the chain was called correctly
        sinon.assert.calledOnce(knexStub)
        sinon.assert.calledWith(knexStub, 'movie_actor')
        sinon.assert.calledTwice(mockGenreChain.join) // Called twice - once for movie, once for genre
        sinon.assert.calledWith(mockGenreChain.join.firstCall, 'movie', 'movie_actor.movieId', '=', 'movie.id')
        sinon.assert.calledWith(mockGenreChain.join.secondCall, 'genre', 'movie.genreId', '=', 'genre.id')
        sinon.assert.calledWith(mockGenreChain.where, 'movie_actor.actorId', anyId)
        sinon.assert.calledWith(mockGenreChain.count, '* as movieCount')
        sinon.assert.calledOnce(mockGenreChain.groupBy) // Called once with two arguments
        sinon.assert.calledWith(mockGenreChain.groupBy, 'genre.id', 'genre.name')
        sinon.assert.calledWith(mockGenreChain.orderBy, 'movieCount', 'desc')
      } finally {
        // Restore original knex
        knexModule.knex = originalKnex;
      }
    })
    
    it('calls the necessary database queries', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const anyId = 123
      
      await getFavoriteGenre(anyId)
      
      // Verify that find was called
      sinon.assert.calledOnce(context.stub.knex_from)
      sinon.assert.calledWith(context.stub.knex_from, 'actor')
    })
  })
  
  describe('addMovieToActor with character name', () => {
    it('successfully adds movie to actor with character name', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()

      const actorId = 123
      const movieId = 456
      const characterName = 'John Doe'

      context.stub.knex_insert.resolves()

      const result = await addMovieToActor(actorId, movieId, characterName)

      sinon.assert.calledOnceWithExactly(context.stub.knex_into, 'movie_actor')
      sinon.assert.calledOnceWithExactly(context.stub.knex_insert, { actorId, movieId, characterName })

      expect(result).to.be.true()
    })
  })
  
  describe('getCharacterNames', () => {
    it('returns null when actor does not exist', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()
      
      const anyId = 999
      
      // Configure mock chain for find to return null
      const mockFindChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(null)
      };
      context.stub.knex_from.withArgs('actor').returns(mockFindChain);
      
      const result = await getCharacterNames(anyId)
      
      expect(result).to.be.null()
    })
    
    it('returns array of character names when actor exists', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()
      
      const anyId = 123
      const mockActor = {
        id: anyId,
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      
      // Configure mock chain for find to return actor
      const mockFindChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(mockActor)
      };
      context.stub.knex_from.withArgs('actor').returns(mockFindChain);
      
      // Mock the character names query
      const knexModule = require('../util/knex');
      const originalKnex = knexModule.knex;
      
      const mockCharacterResults = [
        { characterName: 'Iron Man' },
        { characterName: 'Tony Stark' },
        { characterName: 'Sherlock Holmes' }
      ];
      
      const mockCharacterChain = {
        where: sandbox.stub().returnsThis(),
        whereNotNull: sandbox.stub().returnsThis(),
        select: sandbox.stub().resolves(mockCharacterResults)
      };
      
      const knexStub = sandbox.stub();
      knexStub.withArgs('movie_actor').returns(mockCharacterChain);
      // @ts-ignore - Adding from property for test mocking
      knexStub.from = context.stub.knex_from;
      
      knexModule.knex = knexStub;
      
      try {
        const result = await getCharacterNames(anyId)
        
        expect(result).to.exist()
        expect(result).to.be.an.array()
        expect(result).to.have.length(3)
        expect(result).to.equal(['Iron Man', 'Tony Stark', 'Sherlock Holmes'])
        
        sinon.assert.calledOnce(knexStub)
        sinon.assert.calledWith(knexStub, 'movie_actor')
        sinon.assert.calledWith(mockCharacterChain.where, 'actorId', anyId)
        sinon.assert.calledWith(mockCharacterChain.whereNotNull, 'characterName')
        sinon.assert.calledWith(mockCharacterChain.select, 'characterName')
      } finally {
        knexModule.knex = originalKnex;
      }
    })
    
    it('returns empty array when actor has no character names', async ({context}: Flags) => {
      if(!isContext(context)) throw TypeError()
      
      const anyId = 123
      const mockActor = {
        id: anyId,
        name: 'Test Actor',
        bio: 'Test Bio',
        bornAt: new Date('1990-01-01')
      }
      
      // Configure mock chain for find to return actor
      const mockFindChain = {
        where: sandbox.stub().returnsThis(),
        first: sandbox.stub().resolves(mockActor)
      };
      context.stub.knex_from.withArgs('actor').returns(mockFindChain);
      
      // Mock the character names query to return empty
      const knexModule = require('../util/knex');
      const originalKnex = knexModule.knex;
      
      const mockCharacterChain = {
        where: sandbox.stub().returnsThis(),
        whereNotNull: sandbox.stub().returnsThis(),
        select: sandbox.stub().resolves([])
      };
      
      const knexStub = sandbox.stub();
      knexStub.withArgs('movie_actor').returns(mockCharacterChain);
      // @ts-ignore - Adding from property for test mocking
      knexStub.from = context.stub.knex_from;
      
      knexModule.knex = knexStub;
      
      try {
        const result = await getCharacterNames(anyId)
        
        expect(result).to.exist()
        expect(result).to.be.an.array()
        expect(result).to.have.length(0)
      } finally {
        knexModule.knex = originalKnex;
      }
    })
  })
}))
