import { error } from '@sveltejs/kit';
import type { Server } from 'socket.io';

import { logger } from '$lib/logger';
import { StringUtils } from '$lib/StringUtils';
import { HttpStatus } from '$lib/utils';
import { db } from '$lib/server/db/db.d'
import { Status, getStatus } from '$lib/model/status.d'

import type { PageServerLoad } from './$types';

export const load = (async (eventFromServer) => {
    const gameId = StringUtils.trimEndMarkers(eventFromServer.params.game_id);

    const gameRoom = `gameRoom:${gameId}`
    const io : Server = globalThis.io;
    const sockets = await io.in(gameRoom).fetchSockets();
    
    const gameRow = await db
        .withSchema('sniperok')
        .with("player_count", (eb) => eb.selectFrom('game_player as pc')
                                        .select(({ fn }) => ['pc.game_id', fn.count<number>('pc.player_uuid').as('tally')])
                                        .where('pc.game_id', '=', gameId)
                                        .groupBy('pc.game_id')
            )
        .selectFrom('game as g')
        .innerJoin('game_player as gp', 'gp.game_id', 'g.id')
        .innerJoin('user as u', 'u.id', 'gp.player_uuid')
        .innerJoin('player_count as pc', 'pc.game_id', 'g.id')
        .select(['g.id', 'g.status_id', 'u.username as curator', 'g.is_public', 'pc.tally as player_count', 'g.min_players', 'g.rounds', 'g.start_time'])
        .where('g.id', '=', gameId)
        .where('gp.status_id', '=', Status.activeCurator)
        .executeTakeFirst();

    // const compiledQry = gameQry.compile();
    // logger.trace('gamesQry : ', compiledQry);
    // const game = await db.executeQuery(compiledQry);
    if (!gameRow) {
        logger.error('Game not found ', gameId);
        error(HttpStatus.NOT_FOUND, 'Game not found');
    }

    const game = {
        gameId: gameId,
        status: getStatus(gameRow.status_id),
        curator: gameRow.curator,
        isPublic: gameRow.is_public,
        players: gameRow.player_count,
        minPlayers: gameRow.min_players,
        rounds: gameRow.rounds,
        startTime: gameRow.start_time,
        connected: sockets.length
    };

    return { game };
}) satisfies PageServerLoad;