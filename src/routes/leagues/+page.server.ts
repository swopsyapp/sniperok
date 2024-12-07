import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils'
import { db } from '$lib/server/db/db.d'

import type { Actions, PageServerLoad } from './$types';

export const load = (async (requestEvent) => {
    const { user } = await requestEvent.locals.safeGetSession();
    if (!user) {
        logger.error('User not logged in.');
        redirect('/', { type: 'error', message: 'You are not logged in' }, requestEvent);
    }

    const userId = user.id;

    logger.trace('leagues.load');

    const leaguesQry = db
        .withSchema('junowot')
        .with('member_count',
            (db) => db.selectFrom('league_member as lm')
                      .select(({ fn }) => [
                        'lm.league_id',
                        fn.count<number>('lm.member_uuid').as('member_count')
                      ])
                      .groupBy('lm.league_id')
            )
        .selectFrom('league as l')
        .leftJoin('league_member as lm', 'lm.league_id', 'l.id')
        .select(({ fn }) => [
            'l.id', 'l.name', 'lm.is_curator',
            fn.count<number>('lm.id').as('member_count')
        ])
        .groupBy(['l.id', 'l.name', 'lm.is_curator'])
        .where('l.name', '=', 'public')
        .unionAll(
            db.selectFrom('league as l')
                .innerJoin('league_member as lm', 'lm.league_id', 'l.id')
                .innerJoin('member_count as mc', 'mc.league_id', 'l.id')
                .select(({ fn }) => [
                    'l.id', 'l.name', 'lm.is_curator',
                    fn.sum<number>('mc.member_count').as('member_count')
                ])
                .groupBy(['l.id', 'l.name', 'lm.is_curator'])
                .where('lm.member_uuid', '=', userId) );

    const compiledQry = leaguesQry.compile();
    logger.trace('leaguesQry : ', compiledQry);

    const leagues = await db.executeQuery(compiledQry);

    logger.trace('leagues.length : ', leagues.rows.length);

    return {
        leagues: leagues.rows
    };
}) satisfies PageServerLoad;

export const actions = {
    new: async (requestEvent) => {
        const url = requestEvent.url;
        logger.trace('url : ', url);

        // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
        const { user } = await requestEvent.locals.safeGetSession();
        const userId = user ? user.id : '';

        const leagueName = url.searchParams.get('name');
        if (!leagueName?.trim()) {
            const msg = 'League name cannot be blank';
            logger.warn(msg);
            // setFlash({ type: 'error', message: msg }, requestEvent.cookies);
            return fail(HttpStatus.NOT_ACCEPTABLE);
        }
        logger.trace('leagueName : ', leagueName);

        // See https://kysely.dev/docs/examples/select/function-calls
        const leagueMemberCountQry = db
            .withSchema('junowot')
            .selectFrom('league as l')
            .innerJoin('league_member as lm', 'lm.league_id', 'l.id')
            .where('l.name', '=', leagueName)
            .where('lm.member_uuid', '=', userId)
            .select(({ fn }) => [fn.count<number>('l.id').as('member_count')]);
        
        const compiledQry = leagueMemberCountQry.compile();
        logger.trace('userLeagueOwnerCountQry : ', compiledQry);
        
        const leagueMemberCount = await leagueMemberCountQry.executeTakeFirstOrThrow();

        logger.trace('userLeagueOwnerCount : ', leagueMemberCount);

        if (leagueMemberCount.member_count > 0) {
            const msg = `You are already a member of "${leagueName}"`;
            logger.warn(msg);
            // setFlash({ type: 'error', message: msg }, requestEvent.cookies);
            return fail(HttpStatus.CONFLICT);
        }

        const result = await db.withSchema('junowot').transaction().execute(async (trx) => {
            const league = await trx.insertInto('league')
                .values({
                    name: leagueName,
                    owner: userId,
                })
                .returning('id')
                .executeTakeFirstOrThrow()
          
            await trx.insertInto('league_member')
                .values({
                    league_id: league.id,
                    member_uuid: userId,
                    status_code: 'active',
                    is_curator: true,
                })
                .returningAll()
                .executeTakeFirst()
            
            return { id: parseInt(league.id), name: leagueName }
        });

        logger.trace('league : ', result);

        return { success: true };
    }
} satisfies Actions;
