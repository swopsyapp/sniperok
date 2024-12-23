export enum Status {
    unknown = 0,
    pending = 1,
    active = 2,
    inactive = 3
}

// TODO make this less dumb
export function getStatus(statusId : number) : Status {
    if (statusId == Status.pending.valueOf()) {
        return Status.pending;
    }
    if (statusId == Status.active.valueOf()) {
        return Status.active;
    }
    if (statusId == Status.inactive.valueOf()) {
        return Status.inactive;
    }
    return Status.unknown;
}
