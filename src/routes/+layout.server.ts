import { loadFlash, redirect } from 'sveltekit-flash-message/server';
import { logger } from '$lib/logger';

export const load = loadFlash(async (requestEvent) => {
    const locals = requestEvent.locals;
    const { session, user } = await requestEvent.locals.safeGetSession();

    logger.trace('route: ', requestEvent.route);
    logger.trace('locals: ', Object.keys(locals));
    logger.trace('session: ', session == null ? session : Object.keys(session));

    if (
        !user &&
        !(
            requestEvent.route.id == '/' ||
            requestEvent.route.id == '/auth/login' ||
            requestEvent.route.id == '/auth/register' ||
            requestEvent.route.id == '/games'
        )
    ) {
        logger.error('User not logged in.');
        redirect('/', { type: 'error', message: 'You are not logged in' }, requestEvent);
    }

    return {
        session
    };
});
