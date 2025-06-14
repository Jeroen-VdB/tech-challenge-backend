import { knex } from '../util/knex'

export interface Actor {
  id: number,
  name: string,
  bio: string,
  bornAt: Date
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
