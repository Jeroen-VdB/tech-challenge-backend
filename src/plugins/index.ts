import { Plugin } from '@hapi/hapi'
import { health } from './health'
import { genre } from './genres'
import { movie } from './movies'
import { actor } from './actors'

export const plugins: Plugin<void>[] = [
  health,
  genre,
  movie,
  actor,
]
