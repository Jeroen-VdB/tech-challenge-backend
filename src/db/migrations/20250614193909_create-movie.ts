import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('movie', table => {
        table.increments('id').unsigned().primary();
        table.string('name', 255).notNullable().unique();
        table.text('synopsis');
        table.date('releasedAt').notNullable();
        table.integer('runtimeInMinutes').unsigned().notNullable();
        table.integer('genreId').unsigned().references('id').inTable('genre');
    });
}


export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('movie');
}

