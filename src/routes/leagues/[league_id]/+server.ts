import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils'

export const DELETE: RequestHandler = async (requestEvent) => {
    
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = StringUtils.trimEndMarkers(requestEvent.params.league_id);

    if (!leagueId) {
        error(406, 'League id is mandatory');
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

    const db = requestEvent.locals.db;

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
