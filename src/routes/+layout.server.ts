import { loadFlash } from 'sveltekit-flash-message/server';
import { logger } from '$lib/logger';

export const load = loadFlash(async (requestEvent) => {
    const locals = requestEvent.locals;
    const { session } = await requestEvent.locals.safeGetSession();

    logger.trace('route: ', requestEvent.route);
    logger.trace('locals: ', Object.keys(locals));
    logger.trace('session: ', session == null ? session : Object.keys(session));

    return {
        session
    };
});
