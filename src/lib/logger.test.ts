import { expect, test } from 'vitest';
import { logger, getLogLevel } from './logger';

test('debug level"', () => {    
    const logLevel = getLogLevel('debug');
    expect(logLevel).toBe(2);
});

test('debug stdout"', () => {    
    const spy = vi.spyOn(console, 'log');

    logger.info("foo");

    expect(spy).toHaveBeenCalledOnce();
});
