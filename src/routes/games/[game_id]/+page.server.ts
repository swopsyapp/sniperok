import { error } from '@sveltejs/kit';
import type { Server } from 'socket.io';
import { setFlash } from 'sveltekit-flash-message/server';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils';
import { getGameDetail, getGameSummary } from '$lib/server/db/gameRepository.d';
import { Status } from '$lib/model/model.d';

import type { PageServerLoad } from './$types';

export const load = (async (eventFromServer) => {
    const { user } = await eventFromServer.locals.safeGetSession();
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

    let gameSummary = undefined;
    if (
        Status.INACTIVE.equals(gameDetail.status) ||
        (gameDetail.currentRound === gameDetail.maxRounds &&
            Status.INACTIVE.equals(gameDetail.currentRoundStatus))
    ) {
        const summaryResult = await getGameSummary(gameId);
        gameSummary = summaryResult.playerScores;
        if (gameSummary && gameSummary.length > 0 && user) {
            const userScore = gameSummary.find(
                (score) => score.username === user.user_metadata.username
            );
            if (userScore && userScore.total_wins === gameSummary[0].total_wins) {
                if (summaryResult.hasAnonymousPlayers) {
                    setFlash({ type: 'success', message: 'You won the game! 🎉' }, eventFromServer);
                } else {
                    setFlash({ type: 'success', message: 'You won a snap! 🎉' }, eventFromServer);
                }
            }
        }
    }

    return { gameDetail, gameSummary };
}) satisfies PageServerLoad;
