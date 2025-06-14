import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    return knex.schema.createTable('actor', table => {
        table.increments('id').unsigned().primary();
        table.string('name', 255).notNullable();
        table.text('bio').notNullable();
        table.date('bornAt').notNullable();
    });
}

export async function down(knex: Knex): Promise<void> {
    return knex.schema.dropTable('actor');
}
