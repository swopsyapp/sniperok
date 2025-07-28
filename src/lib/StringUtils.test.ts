import { expect, test } from 'vitest';
import { StringUtils } from './StringUtils';

test('trimEndMarkers notrim"', () => {
    const hello = StringUtils.trimEndMarkers('Hello World');
    expect(hello).toBe('Hello World');
});

test('trimEndMarkers empty"', () => {
    const empty = StringUtils.trimEndMarkers('');
    expect(empty).toBe('');
});

test('trimEndMarkers trim"', () => {
    const text = StringUtils.trimEndMarkers('[abc]');
    expect(text).toBe('abc');
});

// uuid's generated on supabase using > select uuid_generate_v4();

test('extractSlugFromPath noSeq"', () => {
    const text = StringUtils.extractSlugFromPath('/games/[92cec1a7-a556-49f3-b542-f1cb614b12eb]');
    expect(text).toBe('92cec1a7-a556-49f3-b542-f1cb614b12eb');
});

test('extractSlugFromPath first"', () => {
    const text = StringUtils.extractSlugFromPath(
        '/games/[ab4e6177-e2de-4f61-bbe8-053909bb63e5]',
        1
    );
    expect(text).toBe('ab4e6177-e2de-4f61-bbe8-053909bb63e5');
});

test('extractSlugFromPath second"', () => {
    const text = StringUtils.extractSlugFromPath(
        '/games/[7e0f42cb-f21e-4908-88e7-6636539f46cd]/round[1]',
        2
    );
    expect(text).toBe('1');
});
