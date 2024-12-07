import { error, json } from '@sveltejs/kit';
import { Kysely, PostgresDialect } from 'kysely';

import { z } from 'zod';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils'
import { type DB } from '$lib/db/junowot-schema.d';
import type { RequestHandler } from './$types';

async function isCurator(db: Kysely<DB>, leagueId : string, userId : string) : Promise<boolean> {
    
    const userCuratorCountQry = db
        .withSchema('junowot')
        .selectFrom('league_member as lm')
        .where('lm.league_id', '=', leagueId)
        .where('lm.member_uuid', '=', userId)
        .where('lm.is_curator', '=', true)
        .select(({ fn }) => [fn.count<number>('lm.member_uuid').as('curator_count')]);

    const compiledQry = userCuratorCountQry.compile();
    logger.debug('userLeagueOwnerCountQry : ', compiledQry);
    
    const userCuratorCount = await userCuratorCountQry.executeTakeFirstOrThrow();

    logger.debug('userCuratorCount : ', userCuratorCount);

    if ( userCuratorCount.curator_count > 0 ) {
        return true;
    }

    return false;
}

export const DELETE: RequestHandler = async (requestEvent) => {
    
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);

    if (!leagueId) {
        error(HttpStatus.NOT_ACCEPTABLE, 'League id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const db = requestEvent.locals.db;

    const isCurrentUserCurator = await isCurator(db, leagueId, userId);
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

    await db.withSchema('junowot').transaction().execute(async (trx) => {
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
    
    logger.debug("requestEvent : start");
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);
    if (!leagueId) {
        error(HttpStatus.NOT_ACCEPTABLE, 'League id is mandatory');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : '';

    const db = requestEvent.locals.db;

    const isCurrentUserCurator = await isCurator(db, leagueId, userId);
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

    await db.withSchema('junowot').transaction().execute(async (trx) => {
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