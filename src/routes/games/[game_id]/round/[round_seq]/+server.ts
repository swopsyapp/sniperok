import { error, json } from '@sveltejs/kit';

import { getRoundScore } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';
// import { getStatus, Status } from '$lib/model/model.d';

import type { RequestHandler } from './$types';

/**
 * GET : this method returns the scores for the requested game + round combination.
 * @param requestEvent
 * @returns
 */
export const GET: RequestHandler = async (requestEvent) => {
    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : null;

    if (userId == undefined) {
        // Must be logged in as registered or anonymous
        logger.warn('User not logged in');
        error(HttpStatus.UNAUTHORIZED, 'User not logged in');
    }

    const gameId = parseInt(StringUtils.trimEndMarkers(requestEvent.params.game_id));
    const roundSeq = parseInt(StringUtils.trimEndMarkers(requestEvent.params.round_seq));
    const roundScore = await getRoundScore(gameId, roundSeq);

    return json( roundScore );
};
