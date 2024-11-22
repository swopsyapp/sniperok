import { loadFlash } from 'sveltekit-flash-message/server';
import { logger } from '$lib/logger';

export const load = loadFlash(async (requestEvent) => {
    
    const locals = requestEvent.locals;
    const session = locals.session;
    
    logger.debug('locals: ', Object.keys(locals));
    logger.debug('session: ', session == null ? session : Object.keys(session));

    return {
        session
    };
});
