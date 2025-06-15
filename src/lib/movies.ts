import { knex } from '../util/knex'

export interface Movie {
  id: number,
  name: string,
  synopsis?: string,
  releasedAt: Date,
  runtimeInMinutes: number,
  genreId?: number
}

export function list(): Promise<Movie[]> {
  return knex.from('movie').select()
}

export function find(id: number): Promise<Movie> {
  return knex.from('movie').where({ id }).first()
}

/** @returns whether the ID was actually found */
export async function remove(id: number): Promise<boolean> {
  const count = await knex.from('movie').where({ id }).delete()
  return count > 0
}

/** @returns the ID that was created */
export async function create(movie: Omit<Movie, 'id'>): Promise<number> {
  const [ id ] = await (knex.into('movie').insert(movie))
  return id
}

/** @returns whether the ID was actually found */
export async function update(id: number, movie: Partial<Omit<Movie, 'id'>>): Promise<boolean>  {
  const count = await knex.from('movie').where({ id }).update(movie)
  return count > 0
}
