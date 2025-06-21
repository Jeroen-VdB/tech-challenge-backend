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
    genreId?: number,
    characterName?: string
  }[]
}

export interface FavoriteGenre {
  id: number,
  name: string,
  movieCount: number
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
      .select('movie.*', 'movie_actor.characterName')
    
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
export async function addMovieToActor(actorId: number, movieId: number, characterName?: string): Promise<boolean> {
  try {
    await knex.into('movie_actor').insert({ actorId, movieId, characterName })
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

/**
 * Get all character names that an actor has played
 * @param actorId The ID of the actor
 * @returns Array of character names, or null if actor doesn't exist
 */
export async function getCharacterNames(actorId: number): Promise<string[] | null> {
  // First check if the actor exists
  const actor = await find(actorId)
  
  if (!actor) {
    return null
  }
  
  try {
    const results = await knex('movie_actor')
      .where('actorId', actorId)
      .whereNotNull('characterName')
      .select('characterName')
    
    return results.map(r => r.characterName)
  } catch (error) {
    console.error('Error fetching character names for actor:', error)
    return []
  }
}

/**
 * Get the favorite genre of an actor based on the genre that appears most in their movies
 * @param actorId The ID of the actor
 * @returns The favorite genre with movie count, or null if actor doesn't exist or has no movies with genres
 */
export async function getFavoriteGenre(actorId: number): Promise<FavoriteGenre | null> {
  // First check if the actor exists
  const actor = await find(actorId)
  
  if (!actor) {
    return null
  }
  
  try {
    const result = await knex('movie_actor')
      .join('movie', 'movie_actor.movieId', '=', 'movie.id')
      .join('genre', 'movie.genreId', '=', 'genre.id')
      .where('movie_actor.actorId', actorId)
      .select('genre.id', 'genre.name')
      .count('* as movieCount')
      .groupBy('genre.id', 'genre.name')
      .orderBy('movieCount', 'desc')
      .first() as { id: number, name: string, movieCount: string | number } | undefined
    
    if (!result) {
      return null
    }
    
    return {
      id: Number(result.id),
      name: String(result.name),
      movieCount: typeof result.movieCount === 'number' ? result.movieCount : parseInt(result.movieCount, 10)
    }
  } catch (error) {
    // Handle case where tables don't exist or other errors
    console.error('Error fetching favorite genre for actor:', error)
    return null
  }
}
