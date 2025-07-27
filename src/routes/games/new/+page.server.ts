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
    default: async ({ request, locals, cookies }) => {
        // const data = await request.formData();
        const jsonBody = await request.json();
        logger.trace('New game : ', jsonBody);

        const isPublic: boolean = jsonBody.isPublic;
        const minPlayers: number = jsonBody.minPlayers;
        const startSeconds: number = jsonBody.startSeconds;
        const startTime: Date = new Date();
        startTime.setSeconds(startTime.getSeconds() + startSeconds);

        // NOTE: user should never be null here due to authguard hook : src/hooks.server.ts
        const { user } = await locals.safeGetSession();
        const userId = user ? user.id : '';

        const gameId = await createGame(isPublic, minPlayers, startTime, userId);

        if (!gameId) {
            error(HttpStatus.INTERNAL_SERVER_ERROR, 'Error occurred');
        }

        flashRedirect(`/games/[${gameId}]`, { type: 'success', message: 'Game created' }, cookies);
    }
};
