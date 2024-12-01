import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { type DB } from './junowot-schema.d';
import { DATABASE_URL } from "$env/static/private";

const dialect = new PostgresDialect({
    pool: new pg.Pool({
        connectionString: DATABASE_URL,
        max: 10
    })
});

export const db = new Kysely<DB>({
    dialect
});

export type DB = typeof db;
