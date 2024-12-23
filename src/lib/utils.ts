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
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    NOT_ACCEPTABLE = 406,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500
}
