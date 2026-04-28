import { describe, it, expect } from 'vitest';
import { formatLabel } from './formatters';

describe('formatLabel', () => {
	it('formats a standard URL by its last path segment', () => {
		expect(formatLabel('https://example.com/path/to/playlist.m3u')).toBe('playlist.m3u');
	});

	it('returns the hostname if there is no path', () => {
		expect(formatLabel('https://example.com')).toBe('example.com');
	});

	it('truncates long labels', () => {
		const longUrl = 'https://example.com/this-is-a-very-long-filename-that-should-be-truncated.m3u';
		expect(formatLabel(longUrl)).toBe('this-is-a-very-long-filenam...');
		expect(formatLabel(longUrl).length).toBe(30);
	});

	it('handles invalid URLs by returning truncated raw string', () => {
		const invalidUrl = 'not-a-url-but-it-is-very-long-and-should-be-truncated';
		expect(formatLabel(invalidUrl)).toBe('not-a-url-but-it-is-very-lo...');
	});

	it('handles short invalid URLs', () => {
		expect(formatLabel('short-string')).toBe('short-string');
	});
});
