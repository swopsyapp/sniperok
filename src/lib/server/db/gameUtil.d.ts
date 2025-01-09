import { sql } from 'kysely';

import { db } from '$lib/server/db/db.d';

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
