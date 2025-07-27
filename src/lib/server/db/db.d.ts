import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { type DB } from './sniperok-schema.d';
import { DATABASE_URL } from '$env/static/private';

const dialect = new PostgresDialect({
    pool: new pg.Pool({
        connectionString: DATABASE_URL,
        max: 10
    }),
    log: ['query', 'error']
});

export const db = new Kysely<DB>({
    dialect
});

// eslint-disable-next-line no-redeclare
export type DB = typeof db;
