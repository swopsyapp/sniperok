export class Status {
    public static readonly UNKNOWN = new Status(0, 'unknown');
    public static readonly PENDING = new Status(1, 'pending');
    public static readonly ACTIVE = new Status(2, 'active');
    public static readonly INACTIVE = new Status(3, 'inactive');

    private value: number;
    private description: string;

    private constructor(value: number, description: string) {
        this.value = value;
        this.description = description;
    }

    public valueOf(): number {
        return this.value;
    }

    public toString(): string {
        return this.description;
    }

    public equals(obj: Status | string | number): boolean {
        let result = false;
        if (obj instanceof Status) {
            result = this.value === obj.value;
        } else if (typeof obj === 'string') {
            result = this.description === obj;
        } else if (typeof obj === 'number') {
            result = this.value === obj;
        }
        return result;
    }

    public static statusForValue(value: number): Status {
        switch (value) {
            case 0:
                return Status.UNKNOWN;
            case 1:
                return Status.PENDING;
            case 2:
                return Status.ACTIVE;
            case 3:
                return Status.INACTIVE;
            default:
                return Status.UNKNOWN;
        }
    }

    public static statusForDescription(description: string): Status {
        switch (description) {
            case 'unknown':
                return Status.UNKNOWN;
            case 'pending':
                return Status.PENDING;
            case 'active':
                return Status.ACTIVE;
            case 'inactive':
                return Status.INACTIVE;
            default:
                return Status.UNKNOWN;
        }
    }
}

export interface GameDetail {
    gameId: string;
    status: string;
    curator: string;
    isPublic: boolean;
    startTime: Date;

    minPlayers: number;
    players: number;
    connected: number | undefined;

    maxRounds: number;
    currentRound: number;
    currentRoundStatus: string;
}

export interface PlayerScore {
    username: string;
    weapon: string;
    wins: number;
    losses: number;
    ties: number;
    score: number;
}

export interface RoundScore {
    gameId: string;
    status: string;
    roundSeq: number;
    scores: PlayerScore[];
}

export interface GameSummary {
    username: string;
    total_wins: number;
}
