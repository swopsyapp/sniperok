import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';

export const DELETE: RequestHandler = (requestEvent) => {
    
    logger.trace("requestEvent : ", requestEvent);

    const leagueId = Number(StringUtils.trimEndMarkers(requestEvent.params.league_id) ?? '0');

    if (leagueId == 0) {
        error(406, 'League id is mandatory');
    }

    logger.debug("About to delete league : ", leagueId);

    /*
        Check that league has only 1 remaining member who should be a curator
        Then within a single transaction
        - Delete all games linked to league
        - Delete the last league_member
        - Delete the league
    */

    return json({ success: true })
};
