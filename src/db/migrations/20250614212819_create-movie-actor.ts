import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('movie_actor', table => {
        table.increments('id').unsigned().primary();
        table.integer('movieId').unsigned().notNullable().references('id').inTable('movie').onDelete('CASCADE');
        table.integer('actorId').unsigned().notNullable().references('id').inTable('actor').onDelete('CASCADE');
        
        // Ensure an actor can't be added to the same movie multiple times
        table.unique(['movieId', 'actorId']);
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('movie_actor');
}
