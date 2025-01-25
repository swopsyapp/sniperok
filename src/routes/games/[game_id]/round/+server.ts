import { error, json } from '@sveltejs/kit';

import { getGameDetail, nextRound } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';
import { Status } from '$lib/model/model.d';

import type { RequestHandler } from './$types';

/**
 * POST : this method creates the next round in the game is possible
 * @param requestEvent
 * @returns
 */
export const POST: RequestHandler = async (requestEvent) => {
    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : null;
    const username = user ? user.user_metadata.username : null;

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

    if (gameDetail.curator != username) {
        logger.warn(`Not the game curator ${username} != ${gameDetail.curator}`);
        error(HttpStatus.FORBIDDEN, 'Not the game curator');
    }

    if ( !Status.INACTIVE.equals(gameDetail.currentRoundStatus) ) {
        logger.warn(`Round is not yet inactive ${gameDetail.currentRoundStatus}`);
        error(HttpStatus.TOO_EARLY, 'Current Round is not yet inactive');
    }

    if ( gameDetail.currentRound >= gameDetail.maxRounds ) {
        logger.warn(`Game already completed ${gameDetail.currentRound} >= ${gameDetail.maxRounds}`);
        error(HttpStatus.CONFLICT, 'Game already completed');
    }

    const result = await nextRound(gameId);

    return json( result );
};
