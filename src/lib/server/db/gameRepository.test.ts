import { describe, it, expect, vi, beforeEach } from 'vitest';
import { db } from '$lib/server/db/db.d';
import { createGame, getGameDetail, deleteGame } from './gameRepository.d';
import { Status } from '$lib/model/model.d';

// Mock the db module
vi.mock('$lib/server/db/db.d', () => ({
    db: {
        withSchema: vi.fn(() => db),
        with: vi.fn(() => db),
        selectFrom: vi.fn(() => db),
        insertInto: vi.fn(() => db),
        innerJoin: vi.fn(() => db),
        where: vi.fn(() => db),
        groupBy: vi.fn(() => db),
        having: vi.fn(() => db),
        orderBy: vi.fn(() => db),
        select: vi.fn(() => db),
        returning: vi.fn(() => db),
        values: vi.fn(() => db),
        executeTakeFirst: vi.fn(),
        executeTakeFirstOrThrow: vi.fn(),
        transaction: vi.fn(() => ({
            execute: vi.fn().mockImplementation(async (callback) => {
                const trx = {
                    insertInto: vi.fn().mockReturnThis(),
                    values: vi.fn().mockReturnThis(),
                    returning: vi.fn().mockReturnThis(),
                    executeTakeFirstOrThrow: vi.fn().mockResolvedValue({ id: 'a-valid-uuid' }),
                    executeTakeFirst: vi.fn(),
                    deleteFrom: vi.fn().mockReturnThis(),
                    where: vi.fn().mockReturnThis(),
                    execute: vi.fn().mockResolvedValue(undefined)
                };
                await callback(trx);
            }),
            then: vi.fn(),
            catch: vi.fn()
        }))
    }
}));

// Mock the logger
vi.mock('$lib/logger', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        trace: vi.fn()
    }
}));

describe('gameRepository', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('createGame', () => {
        it('should return a gameId when creation is successful', async () => {
            const result = await createGame(true, 2, new Date(), 'a-user-uuid');
            expect(result).toBe('a-valid-uuid');
        });
    });

    describe('getGameDetail', () => {
        it('should return game details for a valid gameId', async () => {
            const gameId = 'a-valid-uuid';
            const mockGameRecord = {
                id: gameId,
                status_id: Status.PENDING.valueOf(),
                curator: 'testuser',
                is_public: true,
                start_time: new Date(),
                min_players: 2,
                player_count: 1,
                max_rounds: 3,
                current_round_seq: 1,
                current_round_status: 'pending'
            };

            (db.executeTakeFirst as vi.Mock).mockResolvedValue(mockGameRecord);

            const result = await getGameDetail(gameId);

            expect(result).toBeDefined();
            expect(result?.gameId).toBe(gameId);
            expect(db.withSchema).toHaveBeenCalledWith('sniperok');
        });

        it('should return undefined for an invalid gameId', async () => {
            const gameId = 'an-invalid-uuid';
            (db.executeTakeFirst as vi.Mock).mockResolvedValue(undefined);

            const result = await getGameDetail(gameId);

            expect(result).toBeUndefined();
        });
    });

    describe('deleteGame', () => {
        it('should return true when deletion is successful', async () => {
            const gameId = 'a-valid-uuid';
            const result = await deleteGame(gameId);

            expect(result).toBe(true);
            expect(db.transaction).toHaveBeenCalled();
        });
    });
});
