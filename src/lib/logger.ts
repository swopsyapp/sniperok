import { Logger } from 'tslog';
import { PUBLIC_TSLOG_MIN_LEVEL } from '$env/static/public';

export const LOG_LEVEL_TRACE = 1;
export const LOG_LEVEL_DEBUG = 2;

export function getLogLevel(level: string): number {
    const logLevels: { [key: string]: number } = {
        silly: 0,
        trace: LOG_LEVEL_TRACE,
        debug: LOG_LEVEL_DEBUG,
        info: 3,
        warn: 4,
        error: 5,
        fatal: 6
    };

    // Return the corresponding log level or default to 'info' level (3)
    return logLevels[level?.toLowerCase()] ?? 3;
}

export const logger = new Logger({
    name: 'mainLogger',
    minLevel: getLogLevel(PUBLIC_TSLOG_MIN_LEVEL)
});
