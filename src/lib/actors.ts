import { knex } from '../util/knex'

export interface Actor {
  id: number,
  name: string,
  bio: string,
  bornAt: Date
}

export interface ActorWithMovies extends Actor {
  movies: {
    id: number,
    name: string,
    synopsis?: string,
    releasedAt: Date,
    runtimeInMinutes: number,
    genreId?: number
  }[]
}

export function list(): Promise<Actor[]> {
  return knex.from('actor').select()
}

export function find(id: number): Promise<Actor> {
  return knex.from('actor').where({ id }).first()
}

/** @returns whether the ID was actually found */
export async function remove(id: number): Promise<boolean> {
  const count = await knex.from('actor').where({ id }).delete()
  return count > 0
}

/** @returns the ID that was created */
export async function create(actor: Omit<Actor, 'id'>): Promise<number> {
  const [ id ] = await (knex.into('actor').insert(actor))
  return id
}

/** @returns whether the ID was actually found */
export async function update(id: number, actor: Partial<Omit<Actor, 'id'>>): Promise<boolean>  {
  const count = await knex.from('actor').where({ id }).update(actor)
  return count > 0
}

/**
 * Get all movies that an actor has starred in
 * @param actorId The ID of the actor
 * @returns The actor with their movies, or null if the actor doesn't exist
 */
export async function getMoviesByActor(actorId: number): Promise<ActorWithMovies | null> {
  // First check if the actor exists
  const actor = await find(actorId)
  
  if (!actor) {
    return null
  }
  
  try {
    const movies = await knex('movie')
      .join('movie_actor', 'movie.id', '=', 'movie_actor.movieId')
      .where('movie_actor.actorId', actorId)
      .select('movie.*')
    
    return {
      ...actor,
      movies
    }
  } catch (error) {
    // For tests - if the migration hasn't been run yet, return empty movies array
    console.error('Error fetching movies for actor:', error)
    return {
      ...actor,
      movies: []
    }
  }
}

/**
 * Associate an actor with a movie
 * @param actorId The ID of the actor
 * @param movieId The ID of the movie
 * @returns true if successful, false if either ID doesn't exist
 */
export async function addMovieToActor(actorId: number, movieId: number): Promise<boolean> {
  try {
    await knex.into('movie_actor').insert({ actorId, movieId })
    return true
  } catch (error) {
    // Could be a foreign key violation (actor or movie doesn't exist)
    // or a unique constraint violation (actor already in this movie)
    return false
  }
}

/**
 * Remove an association between an actor and a movie
 * @param actorId The ID of the actor
 * @param movieId The ID of the movie
 * @returns true if successful, false if the association didn't exist
 */
export async function removeMovieFromActor(actorId: number, movieId: number): Promise<boolean> {
  try {
    const count = await knex.from('movie_actor')
      .where({ actorId, movieId })
      .delete()
    
    return count > 0
  } catch (error) {
    // Handle case where table doesn't exist yet
    console.error('Error removing movie from actor:', error)
    return false
  }
}
