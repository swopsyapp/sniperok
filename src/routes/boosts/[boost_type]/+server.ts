import { error, json } from '@sveltejs/kit';

import { getUserBoosts, buyBoost, sellBoost } from '$lib/server/db/gameRepository.d';

import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';
import { StringUtils } from '$lib/StringUtils';
import { Boost } from '$lib/model/model.d';

import type { RequestHandler } from './$types';

/**
 * POST : this method is used for players to "Sell" convert boosts of type [boost_type] to Snaps.
 * @param requestEvent
 * @returns { success: true }
 */
export const DELETE: RequestHandler = async (requestEvent) => {
    const boostType = StringUtils.trimEndMarkers(requestEvent.params.boost_type);

    if (!boostType) {
        logger.warn('Boost type is required');
        error(HttpStatus.BAD_REQUEST, 'Boost type is required');
    }

    if (!Boost.PLAYABLE_BOOSTS.includes(boostType)) {
        logger.warn(`Invalid boost type: ${boostType}`);
        error(HttpStatus.BAD_REQUEST, 'Invalid boost type');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : null;

    if (userId == undefined) {
        // Must be logged in as registered or anonymous
        logger.warn('User not logged in');
        error(HttpStatus.UNAUTHORIZED, 'User not logged in');
    }

    const userBoosts = await getUserBoosts(userId);

    const boost = userBoosts.find((b) => b.boost_type_code === boostType);

    if (!boost) {
        // This shouldn't happen, all boosts should be shown however some may have quantity zero.
        logger.error(`User does not have boost of type: ${boostType}`);
        error(HttpStatus.INTERNAL_SERVER_ERROR, `User does not have boost of type: ${boostType}`);
    }

    if (boost.quantity <= 0) {
        logger.warn(`User has no boosts of type: ${boostType}`);
        error(HttpStatus.BAD_REQUEST, `User has no boosts of type: ${boostType}`);
    }

    const result = await sellBoost(userId, boostType, 1);
    const response = result ? 'ok' : 'error';

    return json({ success: response });
};

/**
 * POST : this method is used for players to "Buy" swap boosts of type Snap for a boost of type [boost_type].
 * @param requestEvent
 * @returns { success: true }
 */
export const POST: RequestHandler = async (requestEvent) => {
    const boostType = StringUtils.trimEndMarkers(requestEvent.params.boost_type);

    if (!boostType) {
        logger.warn('Boost type is required');
        error(HttpStatus.BAD_REQUEST, 'Boost type is required');
    }

    if (!Boost.PLAYABLE_BOOSTS.includes(boostType)) {
        logger.warn(`Invalid boost type: ${boostType}`);
        error(HttpStatus.BAD_REQUEST, 'Invalid boost type');
    }

    // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
    const { user } = await requestEvent.locals.safeGetSession();
    const userId = user ? user.id : null;

    if (userId == undefined) {
        // Must be logged in as registered or anonymous
        logger.warn('User not logged in');
        error(HttpStatus.UNAUTHORIZED, 'User not logged in');
    }

    const userBoosts = await getUserBoosts(userId);

    const snapsBoost = userBoosts.find((b) => b.boost_type_code === Boost.SNAPS_BOOST);

    if (!snapsBoost) {
        // This shouldn't happen, all boosts should be shown however some may have quantity zero.
        logger.error(`User snaps boosts not found`);
        error(HttpStatus.INTERNAL_SERVER_ERROR, `User snaps boosts not found`);
    }

    if (snapsBoost.quantity <= 0) {
        logger.warn(`User has no snaps boosts`);
        error(HttpStatus.BAD_REQUEST, `User has no snaps boosts`);
    }

    const result = await buyBoost(userId, boostType, 1);
    const response = result ? 'ok' : 'error';

    return json({ success: response });
};
