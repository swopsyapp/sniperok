import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import { type DB } from './junowot-schema.d';
import { DATABASE_URL } from '$env/static/private';

import { logger } from '$lib/logger';

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

export type DB = typeof db;

export async function isCurator(leagueId: string, userId: string): Promise<boolean> {
    const userCuratorCountQry = db
        .withSchema('junowot')
        .selectFrom('league_member as lm')
        .where('lm.league_id', '=', leagueId)
        .where('lm.member_uuid', '=', userId)
        .where('lm.is_curator', '=', true)
        .select(({ fn }) => [fn.count<number>('lm.member_uuid').as('curator_count')]);

    const compiledQry = userCuratorCountQry.compile();
    logger.trace('userCuratorCountQry : ', compiledQry);

    const userCuratorCount = await userCuratorCountQry.executeTakeFirstOrThrow();

    logger.trace('userCuratorCount : ', userCuratorCount);

    if (userCuratorCount.curator_count > 0) {
        return true;
    }

    return false;
}
