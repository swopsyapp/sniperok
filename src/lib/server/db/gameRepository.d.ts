import { sql, Transaction } from 'kysely';

import { logger } from '$lib/logger';
import { db } from '$lib/server/db/db.d';
import { type DB, type Game } from './sniperok-schema.d';
import { type GameDetail, Status, type RoundScore, type GameSummary } from '$lib/model/model.d';
import { calculateTimeDifference, type TimeDiff } from '$lib/utils';

/**
 * Creates a game, adds the first game_round and also adds the game curator as a game_player
 * @returns gameId as string or undefined
 */
export async function createGame(
    isPublic: boolean,
    minPlayers: number,
    startTime: Date,
    userId: string
): Promise<string | undefined> {
    let game: Game | undefined;

    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            game = await trx
                .insertInto('game')
                .values({
                    status_id: Status.PENDING.valueOf(),
                    is_public: isPublic,
                    min_players: minPlayers,
                    start_time: startTime
                })
                .returning('id')
                .executeTakeFirstOrThrow();

            await trx
                .insertInto('game_round')
                .values({
                    game_id: game.id,
                    round_seq: 1,
                    status_id: Status.PENDING.valueOf()
                })
                .executeTakeFirst();

            await trx
                .insertInto('game_player')
                .values({
                    game_id: game.id,
                    player_uuid: userId,
                    player_seq: 1,
                    status_id: Status.ACTIVE.valueOf()
                })
                .executeTakeFirst();
        })
        .catch(function (err) {
            game = undefined;
            logger.error('Error creating game', err);
        });

    return game?.id;
}

export async function getGameDetail(gameId: string): Promise<GameDetail | undefined> {
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
                    'g.max_rounds',
                    'g.start_time'
                ])
                .where('g.id', '=', gameId)
                .where('gp.player_seq', '=', 1)
        )
        .with('current_round', (eb) =>
            eb
                .selectFrom('current_game as cg')
                .innerJoin('game_round as gr', 'gr.game_id', 'cg.id')
                .innerJoin('status as s', 's.id', 'gr.status_id')
                .select([
                    'gr.game_id',
                    'gr.round_seq as current_round_seq',
                    's.code as current_round_status'
                ])
                .groupBy(['gr.game_id', 'gr.round_seq', 's.code'])
                .having(({ eb, fn }) => eb('gr.round_seq', '=', fn.max(sql`gr.round_seq`)))
        )
        .selectFrom('current_game as cg')
        .innerJoin('current_round as cr', 'cr.game_id', 'cr.game_id')
        .select([
            'cg.id',
            'cg.status_id',
            'cg.curator',
            'cg.is_public',
            'cg.start_time',
            'cg.min_players',
            'cg.player_count',
            'cg.max_rounds',
            'cr.current_round_seq',
            'cr.current_round_status'
        ])
        .orderBy('cr.current_round_seq desc')
        .executeTakeFirst();

    if (!gameRecord) {
        return undefined;
    }

    const gameDetail: GameDetail = {
        gameId: gameRecord.id,
        status: Status.statusForValue(gameRecord?.status_id ?? 0).toString(),
        curator: gameRecord?.curator,
        isPublic: gameRecord?.is_public,
        startTime: gameRecord?.start_time,

        minPlayers: gameRecord?.min_players,
        players: gameRecord?.player_count,

        maxRounds: gameRecord.max_rounds,
        currentRound: gameRecord.current_round_seq,
        currentRoundStatus: gameRecord.current_round_status
    };

    return gameDetail;
}

export async function getPlayerSequence(gameId: string, userId: string) {
    /*
        select gp.*, coalesce(u.username, 'Guest') as username, row_number() over(order by u.created_at) as player_seq
        from sniperok.game_player gp
        join sniperok.user u
            on u.id = gp.player_uuid
        where gp.game_id = 1
        ;
    */
    const playerSeq = await db
        .withSchema('sniperok')
        .selectFrom('game_player as gp')
        .innerJoin('user as u', 'u.id', 'gp.player_uuid')
        .select(['u.username', 'gp.player_seq'])
        .where('gp.game_id', '=', gameId)
        .where('gp.player_uuid', '=', userId)
        .executeTakeFirst();

    if (playerSeq) {
        logger.debug('getPlayerSequence:', playerSeq);
    } else {
        logger.error(
            'getPlayerSequence: playerSeq is undefined for gameId:',
            gameId,
            'userId:',
            userId
        );
    }

    return playerSeq
        ? { username: playerSeq.username, playerSeq: playerSeq.player_seq }
        : undefined;
}

export async function deleteGame(gameId: string): Promise<boolean> {
    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            await trx.deleteFrom('player_turn as pt').where('pt.game_id', '=', gameId).execute();

            await trx.deleteFrom('game_player as gp').where('gp.game_id', '=', gameId).execute();

            await trx.deleteFrom('game_round as gr').where('gr.game_id', '=', gameId).execute();

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

export async function joinGame(gameId: string, userId: string): Promise<boolean> {
    logger.debug(`joinGame() gameId: ${gameId} userId: ${userId}`);
    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            const playerSeq = await trx
                .selectFrom('game_player as tot')
                .leftJoin('game_player as gp', (join) =>
                    join.onRef('gp.game_id', '=', 'tot.game_id').on('gp.player_uuid', '=', userId)
                )
                .select(({ fn, ref }) => [
                    fn.coalesce(ref('gp.player_seq'), sql<number>('count(*) + 1')).as('player_seq'),
                    fn.countAll<number>().as('tally')
                ])
                .where('tot.game_id', '=', gameId)
                .groupBy('gp.player_seq')
                .executeTakeFirstOrThrow();

            logger.debug('joinGame() playerSeq:', playerSeq);

            await trx
                .insertInto('game_player')
                .values({
                    game_id: gameId,
                    player_uuid: userId,
                    player_seq: playerSeq.player_seq,
                    status_id: Status.ACTIVE.valueOf()
                })
                .onConflict((oc) =>
                    oc
                        .column('game_id')
                        .column('player_uuid')
                        .doUpdateSet({ status_id: Status.ACTIVE.valueOf() })
                )
                .executeTakeFirst();
        })
        .catch(function (err) {
            logger.error(`Error joining game : ${gameId} - `, err);
            return false;
        });

    logger.debug('joinGame() ok', gameId, userId);

    return true;
}

export async function refreshGameStatus(gameDetail: GameDetail): Promise<Status> {
    const oldStatus: Status = Status.statusForDescription(gameDetail.status);

    if (Status.PENDING.equals(gameDetail.status)) {
        if (gameDetail.players >= gameDetail.minPlayers) {
            const timeDiff: TimeDiff = calculateTimeDifference(gameDetail.startTime);
            if (timeDiff.diff <= 0) {
                gameDetail.status = Status.ACTIVE.toString();
            }
        }
    } else if (Status.ACTIVE.equals(gameDetail.status)) {
        if (
            gameDetail.currentRound === gameDetail.maxRounds &&
            gameDetail.currentRoundStatus === Status.INACTIVE.toString()
        ) {
            gameDetail.status = Status.INACTIVE.toString();
        }
    }

    if (!oldStatus.equals(gameDetail.status)) {
        await db
            .withSchema('sniperok')
            .transaction()
            .execute(async (trx: Transaction<DB>) => {
                const updResult = await trx
                    .updateTable('game as g')
                    .set({ status_id: Status.statusForDescription(gameDetail.status).valueOf() })
                    .where('g.id', '=', gameDetail.gameId)
                    .where('g.status_id', '=', oldStatus.valueOf())
                    .executeTakeFirst();

                if (
                    updResult.numUpdatedRows == 1 &&
                    gameDetail.status === Status.INACTIVE.toString()
                ) {
                    logger.debug(
                        `Game ${gameDetail.gameId} is now inactive, awarding snaps boosts if applicable.`
                    );
                    await awardSnapsBoosts(trx, gameDetail.gameId);
                }
            })
            .catch(function (err) {
                logger.error(`Error refreshing game status : ${gameDetail.gameId} - `, err);
                return Status.UNKNOWN;
            });
    }

    return gameDetail.status;
}

/**
 * Confirm player has joined game, then insert player_turn.
 * On conflict ignore, cannot change weapon once it has been played.
 * @param gameId
 * @param userId
 * @param roundSeq
 * @param weaponPlayed
 * @param responseTimeMIllis
 * @returns booean : true if successful
 */
export async function playTurn(
    gameId: string,
    userId: string,
    roundSeq: number,
    weaponPlayed: string,
    responseTimeMillis: number
): Promise<boolean> {
    // This confirms that the game_player exists
    const playerSeq = await getPlayerSequence(gameId, userId);

    if (!playerSeq) {
        logger.warn(`Cannot find game(${gameId}) or player(${userId})`);
        return false;
    }

    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            const weapon = await trx
                .selectFrom('weapon as w')
                .selectAll()
                .where('w.code', '=', weaponPlayed)
                .executeTakeFirstOrThrow()
                .catch(function (err) {
                    logger.warn(`weapon(${weaponPlayed}) not found : `, err);
                    return false;
                });

            logger.debug('weaponPlayed:', weapon);

            await trx
                .insertInto('player_turn')
                .values({
                    game_id: gameId,
                    player_uuid: userId,
                    round_seq: roundSeq,
                    weapon_code: weapon.code,
                    response_time_millis: responseTimeMillis
                })
                .onConflict((oc) =>
                    oc.column('game_id').column('player_uuid').column('round_seq').doNothing()
                )
                .executeTakeFirst();
        })
        .catch(function (err) {
            logger.error(
                `Error playing turn : game(${gameId}) user(${userId}) roundSeq(${roundSeq}) - `,
                err
            );
            return false;
        });

    return true;
}

export async function updateCurrentRoundStatus(gameId: string, status: string): Promise<boolean> {
    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            const currentRound = await trx
                .selectFrom('game_round as gr')
                .select(({ fn }) => [fn.max(sql`gr.round_seq`).as('current_round')])
                .where('gr.game_id', '=', gameId)
                .executeTakeFirstOrThrow();

            const statusRow = await trx
                .selectFrom('status as s')
                .selectAll()
                .where('s.code', '=', status)
                .executeTakeFirstOrThrow();

            await trx
                .updateTable('game_round as gr')
                .set({ status_id: statusRow.id })
                .where('gr.game_id', '=', gameId)
                .where('gr.round_seq', '=', currentRound.current_round)
                .executeTakeFirst();

            if (status === Status.INACTIVE.toString()) {
                const gameDetail = await getGameDetail(gameId);
                refreshGameStatus(gameDetail);
            }
        })
        .catch(function (err) {
            logger.error(
                `Error updating current round status : game(${gameId}) status(${status}) - `,
                err
            );
            return false;
        });

    return true;
}

export async function getRoundScore(gameId: string, roundSeq: number): Promise<RoundScore> {
    const roundScoreResult = await db
        .withSchema('sniperok')
        .selectFrom('game_round as gr')
        .innerJoin('status as s', 's.id', 'gr.status_id')
        .innerJoin('round_score as rs', (join) =>
            join.onRef('rs.game_id', '=', 'gr.game_id').onRef('rs.round_seq', '=', 'gr.round_seq')
        )
        .select([
            'rs.game_id',
            'rs.round_seq',
            's.code as round_status',
            'rs.username',
            'rs.player_seq',
            'rs.weapon_code',
            'rs.response_time_millis',
            'rs.wins',
            'rs.losses',
            'rs.ties',
            'rs.score'
        ])
        .where('gr.game_id', '=', gameId)
        .where('gr.round_seq', '=', roundSeq)
        .execute();

    const roundScore: RoundScore = {
        gameId: gameId,
        status: Status.UNKNOWN.toString(),
        roundSeq: roundSeq,
        scores: []
    };

    if (roundScoreResult) {
        roundScoreResult.forEach((row) => {
            if (Status.UNKNOWN.equals(roundScore.status)) {
                roundScore.status = row.round_status;
            }
            roundScore.scores.push({
                username: row.username,
                playerSeq: row.player_seq,
                weapon: row.weapon_code,
                responseTimeMillis: row.response_time_millis,
                wins: row.wins,
                losses: row.losses,
                ties: row.ties,
                score: row.score
            });
        });
    }

    return roundScore;
}

export async function getGameSummary(
    gameId: string
): Promise<{ playerScores: GameSummary[]; hasAnonymousPlayers: boolean }> {
    const players = await db
        .withSchema('sniperok')
        .selectFrom('game_player as gp')
        .innerJoin('user as u', 'u.id', 'gp.player_uuid')
        .select(['gp.player_uuid', 'u.email']) // email is null for anonymous users
        .where('gp.game_id', '=', gameId)
        .execute();

    const hasAnonymousPlayers = players.some((player) => player.email === null);

    const playerScores = await db
        .withSchema('sniperok')
        .selectFrom('round_score as rs')
        .innerJoin('game_player as gp', (join) =>
            join.onRef('gp.game_id', '=', 'rs.game_id').onRef('gp.player_seq', '=', 'rs.player_seq')
        )
        .select(['gp.player_uuid', 'rs.username', sql<number>`sum(rs.wins)`.as('total_wins')])
        .where('rs.game_id', '=', gameId)
        .groupBy(['gp.player_uuid', 'rs.username'])
        .orderBy('total_wins', 'desc')
        .execute();

    return { playerScores, hasAnonymousPlayers };
}

export async function nextRound(gameId: string): Promise<GameDetail | undefined> {
    const gameDetail = await getGameDetail(gameId);

    if (!gameDetail) {
        logger.warn(`Game(${gameId}) not found`);
        return undefined;
    }

    if (gameDetail.currentRound >= gameDetail.maxRounds) {
        logger.warn(`Game(${gameId}) already completed`);
        return gameDetail;
    }

    if (gameDetail.currentRoundStatus !== Status.INACTIVE.toString()) {
        logger.warn(`Round(${gameDetail.currentRound}) of Game(${gameId}) not yet inactive`);
        return gameDetail;
    }

    await db
        .withSchema('sniperok')
        .transaction()
        .execute(async (trx: Transaction<DB>) => {
            await trx
                .insertInto('game_round')
                .values({
                    game_id: gameId,
                    round_seq: gameDetail.currentRound + 1,
                    status_id: Status.PENDING.valueOf()
                })
                .executeTakeFirst();

            gameDetail.currentRound = gameDetail.currentRound + 1;
            gameDetail.currentRoundStatus = Status.PENDING.toString();
        })
        .catch(function (err) {
            logger.error(`Error creating next round : game(${gameId}) - `, err);
        });

    return gameDetail;
}

export async function awardSnapsBoosts(trx: Transaction<DB>, gameId: string): Promise<void> {
    logger.debug(`Awarding snaps boosts for game: ${gameId}`);

    try {
        // 1. Get all players for the game and check for anonymous players
        const players = await trx
            .selectFrom('game_player as gp')
            .innerJoin('user as u', 'u.id', 'gp.player_uuid')
            .select(['gp.player_uuid', 'u.email']) // email is null for anonymous users
            .where('gp.game_id', '=', gameId)
            .execute();

        const hasAnonymousPlayers = players.some((player) => player.email === null);

        if (hasAnonymousPlayers) {
            logger.info(`Game ${gameId} has anonymous players. No snaps boosts will be awarded.`);
            return; // Exit if anonymous players are present
        }

        // 2. Calculate total wins for each player
        const playerScores = await trx
            .selectFrom('round_score as rs')
            .innerJoin('game_player as gp', (join) =>
                join
                    .onRef('gp.game_id', '=', 'rs.game_id')
                    .onRef('gp.player_seq', '=', 'rs.player_seq')
            )
            .select(['gp.player_uuid', sql<number>`sum(rs.wins)::integer`.as('total_wins')])
            .where('rs.game_id', '=', gameId)
            .groupBy('gp.player_uuid')
            .execute();

        if (playerScores.length === 0) {
            logger.info(`No scores found for game ${gameId}. No snaps boosts awarded.`);
            return;
        }

        // Find the maximum score
        const maxScore = Math.max(...playerScores.map((score) => score.total_wins));

        // Find all players with the maximum score
        const winners = playerScores.filter((score) => score.total_wins === maxScore);

        // 3. Determine the winner (single winner only)
        if (winners.length === 1 && maxScore > 0) {
            // Ensure there's a single winner and they actually won rounds
            const winnerUserId = winners[0].player_uuid;
            const boostTypeCode = 'snaps';

            // Call the stored procedure to award the boost
            await trx
                .selectNoFrom(
                    sql`sniperok.award_snaps_boost_transaction(
                    ${winnerUserId}::uuid,
                    ${boostTypeCode},
                    1,
                    ${`Game win: ${gameId}`}
                );`
                )
                .executeTakeFirstOrThrow();

            logger.info(`Awarded 1 snap boost to user ${winnerUserId} for winning game ${gameId}.`);
        } else {
            logger.info(
                `Game ${gameId} resulted in a draw or no wins. No snaps boosts awarded. Winners: ${winners.length} with max score ${maxScore}`
            );
        }
    } catch (err) {
        logger.error(`Error awarding snaps boosts for game ${gameId}: `, err, err.message);
        throw err;
    }
}
