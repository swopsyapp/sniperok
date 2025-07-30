import { describe, it, expect, vi, beforeEach, type MockedFunction } from 'vitest';

import * as gameRepository from './gameRepository.d';

vi.mock('./gameRepository.d', () => ({
    createGame: vi.fn(),
    getGameDetail: vi.fn(),
    deleteGame: vi.fn()
}));
import { Status } from '$lib/model/model.d';

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
            (
                gameRepository.createGame as MockedFunction<typeof gameRepository.createGame>
            ).mockResolvedValue('a-valid-uuid');
            const result = await gameRepository.createGame(true, 2, new Date(), 'a-user-uuid');
            expect(result).toBe('a-valid-uuid');
        });
    });

    describe('getGameDetail', () => {
        it('should return game details for a valid gameId', async () => {
            const gameId = 'a-valid-uuid';
            const mockGameRecord = {
                gameId: gameId,
                status: Status.PENDING.toString(),
                curator: 'testuser',
                isPublic: true,
                startTime: new Date(),
                minPlayers: 2,
                players: 1,
                connected: 1,
                maxRounds: 3,
                currentRound: 1,
                currentRoundStatus: 'pending'
            };

            (
                gameRepository.getGameDetail as MockedFunction<typeof gameRepository.getGameDetail>
            ).mockResolvedValue(mockGameRecord);

            const result = await gameRepository.getGameDetail(gameId);

            expect(result).toBeDefined();
            expect(result?.gameId).toBe(gameId);
        });

        it('should return undefined for an invalid gameId', async () => {
            const gameId = 'an-invalid-uuid';
            (
                gameRepository.getGameDetail as MockedFunction<typeof gameRepository.getGameDetail>
            ).mockResolvedValue(undefined);

            const result = await gameRepository.getGameDetail(gameId);

            expect(result).toBeUndefined();
        });
    });

    describe('deleteGame', () => {
        it('should return true when deletion is successful', async () => {
            (
                gameRepository.deleteGame as MockedFunction<typeof gameRepository.deleteGame>
            ).mockResolvedValue(true);
            const gameId = 'a-valid-uuid';
            const result = await gameRepository.deleteGame(gameId);

            expect(result).toBe(true);
        });
    });
});
