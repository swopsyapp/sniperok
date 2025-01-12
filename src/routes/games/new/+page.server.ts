import { error } from '@sveltejs/kit';
import { redirect as flashRedirect } from 'sveltekit-flash-message/server';

import { createGame } from '$lib/server/db/gameRepository.d';
import { logger } from '$lib/logger';
import { HttpStatus } from '$lib/utils';

/**
 * POST : Create Game
 * @satisfies {import('./$types').Actions}
 */
export const actions = {
    default: async ( { request, locals, cookies }) => {
        // const data = await request.formData();
        const json = await request.json();
        logger.trace('New game : ', json);

        const isPublic : boolean = json.isPublic;
        const minPlayers : number = json.minPlayers;
        const startSeconds : number = json.startSeconds;
        const startTime : Date = new Date();
        startTime.setSeconds(startTime.getSeconds() + startSeconds);

        // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
        const { user } = await locals.safeGetSession();
        const userId = user ? user.id : '';

        const gameId = createGame(isPublic, minPlayers, startTime, userId);

        if (!gameId) {
            error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
        }

        flashRedirect(
            '/games',
            { type: 'success', message: 'Game created' },
            cookies
        );
    }
};
