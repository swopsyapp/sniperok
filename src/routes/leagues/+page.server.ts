import { logger } from '$lib/logger';

import type { PageServerLoad } from './$types';

export const load = (async (requestEvent) => {
    const db = requestEvent.locals.db;

    const leagues = await db.withSchema('junowot').selectFrom('league').selectAll().execute();

    logger.debug('leagues : ', leagues);

    return {
        leagues
    };
}) satisfies PageServerLoad;