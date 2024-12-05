import { fail } from '@sveltejs/kit';
import { redirect } from 'sveltekit-flash-message/server';

import { logger } from '$lib/logger';

import type { Actions, PageServerLoad } from './$types';

export const load = (async (requestEvent) => {
    const db = requestEvent.locals.db;

    const leagues = await db.withSchema('junowot').selectFrom('league').selectAll().execute();

    logger.trace('leagues.length : ', leagues.length);

    return {
        leagues
    };
}) satisfies PageServerLoad;

export const actions = {
    new: async (requestEvent) => {
        const url = requestEvent.url;
        logger.trace('url : ', url);

        const { user } = await requestEvent.locals.safeGetSession();
        if (!user) {
            logger.error('User not logged in.');
            redirect('/', { type: 'error', message: 'You are not logged in' }, requestEvent);
        }

        const userId = user.id;
        const leagueName = url.searchParams.get('name');
        if (!leagueName?.trim()) {
            const msg = 'League name cannot be blank';
            logger.warn(msg);
            // setFlash({ type: 'error', message: msg }, requestEvent.cookies);
            return fail(406);
        }
        logger.trace('leagueName : ', leagueName);

        const db = requestEvent.locals.db;

        // See https://kysely.dev/docs/examples/select/function-calls
        const leagueMemberCountQry = db
            .withSchema('junowot')
            .selectFrom('league as l')
            .innerJoin('league_member as lm', 'lm.league_id', 'l.id')
            .where('l.name', '=', leagueName)
            .where('lm.member_uuid', '=', userId)
            .select(({ fn }) => [fn.count<number>('l.id').as('league_count')]);
        
        const compiledQry = leagueMemberCountQry.compile();
        logger.trace('userLeagueOwnerCountQry : ', compiledQry);
        
        const leagueMemberCount = await leagueMemberCountQry.executeTakeFirstOrThrow();

        logger.trace('userLeagueOwnerCount : ', leagueMemberCount);

        if (leagueMemberCount.league_count > 0) {
            const msg = `You are already a member of "${leagueName}"`;
            logger.warn(msg);
            // setFlash({ type: 'error', message: msg }, requestEvent.cookies);
            return fail(409);
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
