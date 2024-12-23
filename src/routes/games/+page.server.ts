import { db } from '$lib/server/db/db.d'
import { logger } from '$lib/logger';
import { Status, getStatus } from '$lib/model/status.d'

import type { PageServerLoad } from './$types';

export const load = (async () => {

    const gamesQry = db
        .withSchema('sniperok')
        .selectFrom('game as g')
        .innerJoin('game_player as gp', 'gp.game_id', 'g.id')
        .innerJoin('user as u', 'u.id', 'gp.player_uuid')
        .select(['g.id', 'g.status_id', 'u.username as curator', 'g.is_public', 'g.min_players', 'g.rounds', 'g.start_time'])
        .where('g.status_id', '=', Status.pending.valueOf())
        .where('gp.status_id', '=', Status.activeCurator)
        .orderBy('g.start_time desc');

    const compiledQry = gamesQry.compile();
    logger.trace('leaguesQry : ', compiledQry);

    const games = await db.executeQuery(compiledQry);

    const gameList = games.rows.map((gameRow) => {
        return {
            id: gameRow.id,
            status: getStatus(gameRow.status_id),
            curator: gameRow.curator,
            isPublic: gameRow.is_public,
            players: 0,
            minPlayers: gameRow.min_players,
            rounds: gameRow.rounds,
            startTime: gameRow.start_time
        }
    })

    return {
        games: gameList
    };
}) satisfies PageServerLoad;
