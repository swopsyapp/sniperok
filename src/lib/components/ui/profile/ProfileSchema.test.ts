import { expect, test } from 'vitest';
import { logger } from '../../../logger';
import { profileSchema } from './ProfileSchema';

test('Registered', () => {    
    const registered = {
        profileMode: 'update',
        email: 'test1@test.com',
        password: 'Password123',
        username: 'test1'
        // name: undefined,
        // surname: undefined,
        // birthday: undefined
    };

    const result = profileSchema.safeParse(registered);
    logger.trace(result);

    expect(result.success).toBe(true);
});

test('Registered no password', () => {    
    const registered = {
        profileMode: 'update',
        email: 'test1@test.com',
        username: 'test1'
    };

    const result = profileSchema.safeParse(registered);
    // logger.debug(result);

    expect(result.success).toBe(true);
});

test('Unregistered', () => {    
    const unregistered = {
        profileMode: 'create',
        email: 'test1@test.com',
        password: 'Password123',
        username: 'test1'
        // name: undefined,
        // surname: undefined,
        // birthday: undefined
    };

    const result = profileSchema.safeParse(unregistered);
    // logger.debug(result);

    expect(result.success).toBe(true);
});

test('Unregistered no password', () => {    
    const unregistered = {
        profileMode: 'create',
        email: 'test1@test.com',
        username: 'test1'
    };

    const result = profileSchema.safeParse(unregistered);
    logger.info(result.error?.errors[0].message);

    expect(result.success).toBe(false);
});

test('Unregistered short password', () => {    
    const unregistered = {
        profileMode: 'create',
        email: 'test1@test.com',
        password: 'short',
        username: 'test1'
    };

    const result = profileSchema.safeParse(unregistered);
    logger.info(result.error?.errors[0].message);

    expect(result.success).toBe(false);
});
