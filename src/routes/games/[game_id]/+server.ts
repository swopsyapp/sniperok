import { error, json } from '@sveltejs/kit';
import { Transaction } from 'kysely';

import { type DB } from '$lib/server/db/sniperok-schema.d';
import { getGameDetail, getPlayerSequence } from '$lib/server/db/gameRepository.d';
import { db } from '$lib/server/db/db.d';
import { Status } from '$lib/model/model.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';

import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (requestEvent) => {
    const gameId = StringUtils.trimEndMarkers(requestEvent.params.game_id);
    const gameDetail = await getGameDetail(gameId);

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const username = user ? user.user_metadata.username : null;

    if (gameDetail == undefined) {
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    if (username != gameDetail.curator) {
        logger.warn(`Not the game curator ${username} != ${gameDetail.curator}`);
        error(HttpStatus.FORBIDDEN, 'Not the game curator');
    }

    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            await trx.deleteFrom('game_player as gp').where('gp.game_id', '=', gameId).execute();

            await trx.deleteFrom('game as g').where('g.id', '=', gameId).execute();
        })
        .then(() => {
            logger.trace('Deleted game : ', gameId);
        })
        .catch(function (err) {
            logger.error(`Error deleting game : ${gameId} - `, err);
            error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
        });

    return json({ success: true });
};

/**
 * PATCH : this method is being used to join the current user to the game,
 * it adds a game_player if necessary, or updates the status
 * @param requestEvent
 * @returns
 */
export const PATCH: RequestHandler = async (requestEvent) => {
    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const username = user ? user.user_metadata.username : null;
    const userId = user ? user.id : null;

    if (userId == undefined) {
        // Must be logged in as registered or anonymous
        logger.warn('User not logged in');
        error(HttpStatus.UNAUTHORIZED, 'User not logged in');
    }

    const gameId = StringUtils.trimEndMarkers(requestEvent.params.game_id);
    const gameDetail = await getGameDetail(gameId);

    if (gameDetail == undefined) {
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    const activeStatus = username == gameDetail.curator ? Status.activeCurator : Status.active;

    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            await trx
                .insertInto('game_player')
                .values({
                    game_id: gameDetail.gameId,
                    player_uuid: userId,
                    status_id: activeStatus
                })
                .onConflict((oc) =>
                    oc
                        .column('game_id')
                        .column('player_uuid')
                        .doUpdateSet({ status_id: activeStatus })
                )
                .executeTakeFirst();
        })
        .catch(function (err) {
            logger.error(`Error joining game : ${gameId} - `, err);
            error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
        });

    const playerSeq = await getPlayerSequence(gameId, userId);

    if (!playerSeq) {
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred, after joining');
    }

    return json(playerSeq);
};
