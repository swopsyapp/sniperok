import { error, json } from '@sveltejs/kit';
import { Transaction } from 'kysely';

import { z } from 'zod';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils'
import { type DB } from '$lib/server/db/junowot-schema.d';
import { db, isCurator } from '$lib/server/db/db.d';
import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (requestEvent) => {
    
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);

    if (!leagueId) {
        error(HttpStatus.NOT_ACCEPTABLE, 'League id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const isCurrentUserCurator = await isCurator(leagueId, userId);
    if (!isCurrentUserCurator) {
        error(HttpStatus.FORBIDDEN, 'Not a league curator');
    }

    logger.trace("About to delete league : ", leagueId);

    /*
        TODO : Consider validating that league has only 1 remaining member
        who should be a curator before deleting
        Then within a single transaction
        - Delete all games linked to league
        - Delete the last league_member
        - Delete the league
    */
    /*
    const leagueMemberCount = await db
        .withSchema('junowot')
        .selectFrom('league_member as lm')
        .where('lm.league_id', '=', leagueId)
        .select(({ fn }) => [fn.count<number>('lm.member_uuid').as('member_count')])
        .executeTakeFirstOrThrow();
    
        logger.trace('userLeagueOwnerCount : ', leagueMemberCount);

        if (leagueMemberCount.member_count > 1) {
            const msg = `League still has other members`;
            logger.warn(msg);
            return fail(HttpStatus.FORBIDDEN);
        };
    */

    await db.withSchema('junowot').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.deleteFrom('game as g')
                .where('g.league_id', '=', leagueId)
                .execute();

        await trx.deleteFrom('league_member as lm')
                .where('lm.league_id', '=', leagueId)
                .execute();
        
        await trx.deleteFrom('league as l')
                .where('l.id', '=', leagueId)
                .execute();
    }).then(() => {
        logger.trace("Deleted league : ", leagueId);
    }).catch(function(err){
        logger.error(`Error deleting league : ${leagueId} - `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true })
};

export const PATCH: RequestHandler = async (requestEvent) => {
    
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);
    if (!leagueId) {
        error(HttpStatus.NOT_ACCEPTABLE, 'League id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const isCurrentUserCurator = await isCurator(leagueId, userId);
    if (!isCurrentUserCurator) {
        error(HttpStatus.FORBIDDEN, 'Not a league curator');
    }

    const rawBody = await requestEvent.request.text();
    logger.trace("rawBody : ", rawBody);

    const leaguePatchSchema = z.object({
        name: z.string(),
    });

    const leaguePatch = leaguePatchSchema.parse(JSON.parse(rawBody));
    const leagueName = leaguePatch.name;

    logger.trace("About to patch league : ", leagueId);

    await db.withSchema('junowot').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.updateTable('league as l')
                .set({ name: leagueName })
                .where('l.id', '=', leagueId)
                .execute();
    }).then(() => {
        logger.trace("Updated league : ", leagueId);
    }).catch(function(err){
        logger.error(`Error updating league : ${leagueId} - `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true })
}