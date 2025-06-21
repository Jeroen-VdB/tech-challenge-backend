import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('movie_actor', table => {
    table.string('characterName', 255).nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('movie_actor', table => {
    table.dropColumn('characterName');
  });
}