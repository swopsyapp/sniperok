import { sql } from 'kysely';

import { db } from '$lib/server/db/db.d';
import { GameDetail, Status, getStatus } from '$lib/model/model.d';

export async function getGameDetail(gameId: string) : GameDetail | undefined {
    const gameRecord = await db
        .withSchema('sniperok')
        .with('player_count', (eb) =>
            eb
                .selectFrom('game_player as pc')
                .select(({ fn }) => ['pc.game_id', fn.count<number>('pc.player_uuid').as('tally')])
                .where('pc.game_id', '=', gameId)
                .groupBy('pc.game_id')
        )
        .with('current_game', (eb) =>
            eb
                .selectFrom('game as g')
                .innerJoin('game_player as gp', 'gp.game_id', 'g.id')
                .innerJoin('user as u', 'u.id', 'gp.player_uuid')
                .innerJoin('player_count as pc', 'pc.game_id', 'g.id')
                .select([
                    'g.id',
                    'g.status_id',
                    'u.username as curator',
                    'g.is_public',
                    'pc.tally as player_count',
                    'g.min_players',
                    'g.rounds',
                    'g.start_time'
                ])
                .where('g.id', '=', gameId)
                .where('gp.status_id', '=', Status.activeCurator)
        )
        .with('current_round', (eb) =>
            eb
                .selectFrom('current_game as cg')
                .leftJoin('player_turn as pt', 'pt.game_id', 'cg.id')
                .select(({ fn, val, ref }) => [
                    ref('cg.id').as('game_id'),
                    val<string>(gameId).as('cg.game_id'),
                    fn.coalesce(fn.max('pt.round_seq'), val<number>(1)).as('currrent_round_seq')
                ])
                .groupBy(['cg.id'])
        )
        .selectFrom('current_game as cg')
        .innerJoin('current_round as cr', 'cr.game_id', 'cr.game_id')
        .select([
            'cg.id',
            'cg.status_id',
            'cg.curator',
            'cg.is_public',
            'cg.player_count',
            'cg.min_players',
            'cg.rounds',
            'cg.start_time',
            'cr.currrent_round_seq'
        ])
        .executeTakeFirst();
    
    const gameDetail : GameDetail = {
        gameId: gameRecord.id,
        status: getStatus(gameRecord?.status_id),
        curator: gameRecord?.curator,
        isPublic: gameRecord?.is_public,
        startTime: gameRecord?.start_time,

        minPlayers: gameRecord?.min_players,
        players: gameRecord?.player_count,

        rounds: gameRecord?.rounds,
        currentRound: gameRecord?.currrent_round_seq
    };
    
    return gameDetail;
}

export async function getPlayerSequence(gameId: string, userId: string) {
    /*
        select gp.*, coalesce(u.username, 'guest') as username, row_number() over(order by u.created_at) as player_seq
        from sniperok.game_player gp
        join sniperok.user u
            on u.id = gp.player_uuid
        where gp.game_id = 1
        ;
    */
    const playerSeq = await db
        .withSchema('sniperok')
        .with('players', (db) =>
            db
                .selectFrom('game_player as gp')
                .innerJoin('user as u', 'u.id', 'gp.player_uuid')
                .where('gp.game_id', '=', gameId)
                .select(({ fn, val }) => [
                    'gp.player_uuid',
                    fn.coalesce('u.username', val<string>('guest')).as('username'),
                    sql<number>`row_number() over(order by u.created_at)`.as('player_seq')
                ])
        )
        .selectFrom('players as p')
        .where('p.player_uuid', '=', userId)
        .select(['p.username', 'p.player_seq'])
        .executeTakeFirst();

    return playerSeq ? { username: playerSeq.username, playerSeq: playerSeq.player_seq } : undefined;
}
