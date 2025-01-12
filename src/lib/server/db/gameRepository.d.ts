import { sql, Transaction } from 'kysely';

import { db } from '$lib/server/db/db.d';
import { type DB } from './sniperok-schema.d';
import { GameDetail, Status, getStatus } from '$lib/model/model.d';

/**
 * Creates a game, adds the first game_round and also adds the game curator as a game_player
 * @returns gameId as string or undefined
 */
export async function createGame(isPublic: boolean, minPlayers: number, startTime: Date, userId: string): string {
    let gameId: string | undefined;

    await db.withSchema('sniperok').transaction().execute(async (trx : Transaction<DB>) => {
        const game = await trx.insertInto('game')
            .values({
                status_id: Status.pending.valueOf(),
                is_public: isPublic,
                min_players: minPlayers,
                start_time: startTime
            })
            .returning('id')
            .executeTakeFirstOrThrow();
        
        gameId = game.id;

        await trx.insertInto('game_round')
        .values({
            game_id: gameId,
            round_seq: 1,
            status_id: Status.pending
        })
        .executeTakeFirst();

        await trx.insertInto('game_player')
        .values({
            game_id: gameId,
            player_uuid: userId,
            status_id: Status.activeCurator.valueOf()
        })
        .executeTakeFirst();

    }).catch(function(err){
        gameId = undefined;
        logger.error('Error creating game', err);
    });

    return gameId;
}

export async function getGameDetail(gameId: string): GameDetail | undefined {
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
                .leftJoin('game_round as gr', 'gr.game_id', 'cg.id')
                .select(({ fn, val, ref }) => [
                    ref('gr.game_id'),
                    fn.coalesce(fn.max('gr.round_seq'), val<number>(1)).as('currrent_round_seq')
                ])
                .groupBy(['gr.game_id'])
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

    const gameDetail: GameDetail = {
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

    return playerSeq
        ? { username: playerSeq.username, playerSeq: playerSeq.player_seq }
        : undefined;
}

export async function deleteGame(gameId: string): boolean {
    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            await trx.deleteFrom('game_player as gp').where('gp.game_id', '=', gameId).execute();

            await trx.deleteFrom('game as g').where('g.id', '=', gameId).execute();
        })
        .then(() => {
            logger.trace('Deleted game : ', gameId);
        })
        .catch(function (err) {
            logger.error(`Error deleting game : ${gameId} - `, err);
            return false;
        });

    return true;
}

export async function joinGame(gameId: string, userId: string): boolean {
    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            const playerCount = await trx
                .selectFrom('game_player as gp')
                .leftJoin('game_player as c', 'c.game_id', 'gp.game_id')
                .select(({ fn, ref }) => [
                    ref('c.player_uuid').as('curator_uuid'),
                    fn.countAll<number>().as('tally')
                ])
                .where('gp.game_id', '=', gameId)
                .where('c.status_id', '=', Status.activeCurator)
                .executeTakeFirstOrThrow;

            const activeStatus: Status =
                playerCount.tally == 0
                    ? Status.activeCurator
                    : playerCount.curator_uuid == userId
                      ? Status.activeCurator
                      : Status.active;

            await trx
                .insertInto('game_player')
                .values({
                    game_id: gameDetail.gameId,
                    player_uuid: userId,
                    status_id: activeStatus
                })
                .onConflict((oc) =>
                    oc
                        .column('game_id')
                        .column('player_uuid')
                        .doUpdateSet({ status_id: activeStatus })
                )
                .executeTakeFirst();            
        })
        .catch(function (err) {
            logger.error(`Error joining game : ${gameId} - `, err);
            return false;
        });

    return true;
}
