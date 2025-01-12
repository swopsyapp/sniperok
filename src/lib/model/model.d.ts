export enum Status {
    unknown = 0,
    pending = 1,
    active = 2,
    inactive = 3,
    activeCurator = 4
}

export function getStatus(statusId: number): Status {
    const statusMap: { [key: number]: Status } = {
        [Status.pending]: Status.pending,
        [Status.active]: Status.active,
        [Status.inactive]: Status.inactive,
        [Status.activeCurator]: Status.activeCurator,
    };

    return statusMap[statusId] ?? Status.unknown;
}

export function getStatusText(status: Status) {
    switch (status) {
        case Status.pending: return 'Pending';
        case Status.active: return 'Active';
        case Status.inactive: return 'Inactive';
        case Status.activeCurator: return 'Active Curator';
        default: return 'Unknown';
    }
};

export interface GameDetail {
    gameId: string;
    status: Status;
    curator: string;
    isPublic: boolean;
    startTime: Date;

    minPlayers: number;
    players: number;
    connected: number | undefined;

    rounds: number;
    currentRound: number;
}

