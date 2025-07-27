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

test('extractSlugFromPath noSeq"', () => {
    const text = StringUtils.extractSlugFromPath('/games/[3]');
    expect(text).toBe('3');
});

test('extractSlugFromPath first"', () => {
    const text = StringUtils.extractSlugFromPath('/games/[5]', 1);
    expect(text).toBe('5');
});

test('extractSlugFromPath second"', () => {
    const text = StringUtils.extractSlugFromPath('/games/[7]/round[1]', 2);
    expect(text).toBe('1');
});
