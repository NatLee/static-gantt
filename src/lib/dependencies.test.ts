import { describe, expect, it } from 'vitest';
import { formatAfter, parseAfter } from './dependencies';

describe('predecessor lists', () => {
  it('parse trims, drops blanks and duplicates', () => {
    expect(parseAfter(' a , b,,a, ')).toEqual(['a', 'b']);
    expect(parseAfter(undefined)).toEqual([]);
    expect(parseAfter('')).toEqual([]);
  });

  it('format writes the stored comma form, or nothing for an empty list', () => {
    expect(formatAfter(['a', 'b', 'a'])).toBe('a,b');
    expect(formatAfter([])).toBeUndefined();
    expect(formatAfter([' ', ''])).toBeUndefined();
  });
});
