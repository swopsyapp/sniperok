import { error, json } from '@sveltejs/kit';

import { getGameDetail, refreshGameStatus } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';
import { Status } from '$lib/model/model.d';

import type { RequestHandler } from './$types';

/**
 * PATCH : this method is being used to refresh the game status.
 * @param requestEvent
 * @returns
 */
export const PATCH: RequestHandler = async (requestEvent) => {
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

    const newStatus: Status = refreshGameStatus(gameDetail);

    if (Status.UNKNOWN.equals(newStatus)) {
        error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
    }

    return json({ newStatus: gameDetail.status.toString() });
};
