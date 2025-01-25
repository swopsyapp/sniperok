import { error, json } from '@sveltejs/kit';

import { getGameDetail, getPlayerSequence, joinGame } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';

import type { RequestHandler } from './$types';

/**
 * POST : this method is being used to join the current user to the game,
 * it adds a game_player if necessary, or updates the status
 * @param requestEvent
 * @returns {username: string, playerSeq: number}
 */
export const POST: RequestHandler = async (requestEvent) => {
    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : null;

    if (userId == undefined) {
        // Must be logged in as registered or anonymous
        logger.warn('User not logged in');
        error(HttpStatus.UNAUTHORIZED, 'User not logged in');
    }

    const gameId = StringUtils.eventParamToNumber(requestEvent.params.game_id);
    const gameDetail = await getGameDetail(gameId);

    if (gameDetail == undefined) {
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    const joinResult: boolean = await joinGame(gameId, userId);

    if (!joinResult) {
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    }

    const playerSeq = await getPlayerSequence(gameId, userId);

    if (!playerSeq) {
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred, after joining');
    }

    return json(playerSeq);
};
