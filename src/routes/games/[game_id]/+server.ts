import { error, json } from '@sveltejs/kit';
import { Transaction } from 'kysely';

import { type DB } from '$lib/server/db/sniperok-schema.d';
import { db } from '$lib/server/db/db.d';
import { Status } from '$lib/model/status.d'

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';

import type { RequestHandler } from './$types';

async function getGameRecord(gameId : string) {    
    const gameRecord = await db
        .withSchema('sniperok')
        .selectFrom('game as g')
        .innerJoin('game_player as gp', 'gp.game_id', 'g.id')
        .innerJoin('user as u', 'u.id', 'gp.player_uuid')
        .select(['g.id', 'g.status_id', 'u.username as curator', 'g.is_public', 'g.min_players', 'g.rounds', 'g.start_time'])
        .where('g.id', '=', gameId)
        .where('gp.status_id', '=', Status.activeCurator)
        .executeTakeFirst();

    return gameRecord;
}

export const DELETE: RequestHandler = async (requestEvent) => {
    const gameId = StringUtils.trimEndMarkers(requestEvent.params.game_id) ?? '';
    const gameRecord = await getGameRecord(gameId);

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userName = user ? user.user_metadata.username : null;

    if ( gameRecord == undefined ) {
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    if (userName != gameRecord.curator ) {
        logger.warn(`Not the game curator ${userName} != ${gameRecord.curator}`);
        error(HttpStatus.FORBIDDEN, 'Not the game curator');
    }

    await db.withSchema('sniperok').transaction().execute(async (trx : Transaction<DB>) => {
        await trx.deleteFrom('game_player as gp')
                .where('gp.game_id', '=', gameId)
                .execute();
        
        await trx.deleteFrom('game as g')
                .where('g.id', '=', gameId)
                .execute();
    }).then(() => {
        logger.trace("Deleted game : ", gameId);
    }).catch(function(err){
        logger.error(`Error deleting game : ${gameId} - `, err);
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    });

    return json({ success: true });
};