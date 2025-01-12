import { error } from '@sveltejs/kit';
import type { Server } from 'socket.io';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils';
import { getGameDetail } from '$lib/server/db/gameRepository.d';

import type { PageServerLoad } from './$types';

export const load = (async (eventFromServer) => {
    const gameId = StringUtils.trimEndMarkers(eventFromServer.params.game_id);

    const gameDetail = await getGameDetail(gameId);

    if (!gameDetail) {
        logger.error('Game not found ', gameId);
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    const gameRoom = `gameRoom:${gameId}`;
    const io: Server = globalThis.io;
    const sockets = await io.in(gameRoom).fetchSockets();

    gameDetail.connected = sockets.length;

    return { gameDetail };
}) satisfies PageServerLoad;
