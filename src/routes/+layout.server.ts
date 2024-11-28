import { loadFlash } from 'sveltekit-flash-message/server';
import { logger } from '$lib/logger';

export const load = loadFlash(async (requestEvent) => {
    
    const locals = requestEvent.locals;
    const session = locals.session;
    
    logger.trace('locals: ', Object.keys(locals));
    logger.trace('session: ', session == null ? session : Object.keys(session));

    return {
        session
    };
});
