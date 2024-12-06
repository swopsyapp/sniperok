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
