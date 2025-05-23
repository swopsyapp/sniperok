import { error, json } from '@sveltejs/kit';

import { deleteGame, getGameDetail, playTurn } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';

import type { RequestHandler } from './$types';

export const DELETE: RequestHandler = async (requestEvent) => {
    const gameId = StringUtils.eventParamToNumber(requestEvent.params.game_id);
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

    const result: boolean = deleteGame(gameId);

    return json({ success: result });
};

/**
 * PUT : this method is being used for players to play their turn.
 * @param requestEvent
 * @returns { success: true }
 */
export const PUT: RequestHandler = async (requestEvent) => {
    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : null;

    if (userId == undefined) {
        // Must be logged in as registered or anonymous
        logger.warn('User not logged in');
        error(HttpStatus.UNAUTHORIZED, 'User not logged in');
    }

    const gameId = StringUtils.trimEndMarkers(requestEvent.params.game_id);

    const jsonBody = await requestEvent.request.json();

    logger.debug(`playTurn PUT jsonBody: ${JSON.stringify(jsonBody)}`);

    const roundSeq : number = jsonBody.roundSeq;
    const weaponPlayed : string = jsonBody.weaponPlayed;
    const responseTimeMillis : number = jsonBody.responseTimeMillis;

    logger.debug(`playTurn PUT gameId: ${gameId}, userId: ${userId}, roundSeq: ${roundSeq}, weaponPlayed: ${weaponPlayed}, responseTimeMillis: ${responseTimeMillis}`);

    const result = await playTurn(gameId, userId, roundSeq, weaponPlayed, responseTimeMillis);

    return json({ success: result });
};
