import { error, json } from '@sveltejs/kit';

import { getGameDetail, updateCurrentRoundStatus } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';
// import { getStatus, Status } from '$lib/model/model.d';

import type { RequestHandler } from './$types';

/**
 * PUT : this method is being used to update the status of the current round.
 * @param requestEvent
 * @returns
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

    const gameId = StringUtils.eventParamToNumber(requestEvent.params.game_id);
    const gameDetail = await getGameDetail(gameId);

    if (gameDetail == undefined) {
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    const jsonBody = await requestEvent.request.json();

    const status = jsonBody.status;
    const success: boolean = updateCurrentRoundStatus(gameId, status);

    if (success) {
        logger.debug(`Updated current round status to ${status} for game ${gameId}`);
    } else {
        logger.error(`Failed to update current round status to ${status} for game ${gameId}`);
        return json({ success: false });
    }

    return json({ success: true });
};
