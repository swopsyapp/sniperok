import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function booleanToChecked(checked : boolean | null) {
    return checked ? 'checked' : 'unchecked';
}

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    
    SEE_OTHER = 303,

    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,     // Not logged in
    FORBIDDEN = 403,        // Not permitted
    NOT_FOUND = 404,
    NOT_ACCEPTABLE = 406,
    CONFLICT = 409,
    TOO_EARLY = 425,
    INTERNAL_SERVER_ERROR = 500
}

export interface TimeDiff {
    diff: number;
    formatted: string;
}

export function calculateTimeDifference(startTime: Date) : TimeDiff {
    const now = new Date();
    const diff = startTime.getTime() - now.getTime();
    const absDiff = Math.abs(diff);
    const minus = (diff < 0) ? '-' : '';
    const hours = Math.floor(absDiff / (1000 * 60 * 60));
    const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);
    
    const timeDiff = {} as TimeDiff;
    timeDiff.diff = diff;
    timeDiff.formatted = `${minus}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    return timeDiff;
}

export async function sleep(ms: number): Promise<void> {
    return new Promise( (resolve) => setTimeout(resolve, ms) );
}