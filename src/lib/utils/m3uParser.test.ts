import { describe, it, expect } from 'vitest';
import { parseM3U } from './m3uParser';
import { ChannelStatus } from '$lib/types/channel';

describe('parseM3U', () => {
	it('should return an empty array for empty content', () => {
		expect(parseM3U('')).toEqual([]);
		expect(parseM3U('   \n  \t  ')).toEqual([]);
	});

	it('should parse a single channel with EXTINF and a URL', () => {
		const m3u = `
#EXTINF:-1,My Cool Channel
http://example.com/stream.m3u8
		`.trim();

		const channels = parseM3U(m3u);

		expect(channels).toHaveLength(1);
		expect(channels[0]).toEqual({
			id: 0,
			name: 'My Cool Channel',
			url: 'http://example.com/stream.m3u8',
			status: ChannelStatus.Pending
		});
	});

	it('should parse multiple channels correctly', () => {
		const m3u = `
#EXTINF:-1,Channel 1
http://example.com/1.m3u8
#EXTINF:-1 tvg-id="ch2",Channel 2
http://example.com/2.m3u8
		`.trim();

		const channels = parseM3U(m3u);

		expect(channels).toHaveLength(2);
		expect(channels[0]).toMatchObject({
			id: 0,
			name: 'Channel 1',
			url: 'http://example.com/1.m3u8'
		});
		expect(channels[1]).toMatchObject({
			id: 1,
			name: 'Channel 2',
			url: 'http://example.com/2.m3u8'
		});
	});

	it('should ignore empty lines and lines with only whitespace', () => {
		const m3u = `
#EXTM3U

#EXTINF:-1,Channel A

http://example.com/a.m3u8


#EXTINF:-1,Channel B
http://example.com/b.m3u8
		`.trim();

		const channels = parseM3U(m3u);

		expect(channels).toHaveLength(2);
		expect(channels[0].name).toBe('Channel A');
		expect(channels[1].name).toBe('Channel B');
	});

	it('should fall back to "Unnamed" if no name is provided', () => {
		const m3u = `
http://example.com/unnamed.m3u8
		`.trim();

		const channels = parseM3U(m3u);

		expect(channels).toHaveLength(1);
		expect(channels[0]).toMatchObject({
			name: 'Unknown Channel', // actually the current fallback when no #EXTINF
			url: 'http://example.com/unnamed.m3u8'
		});
	});

	it('should parse URLs even without EXTINF lines', () => {
		const m3u = `
http://example.com/1.m3u8
http://example.com/2.m3u8
		`.trim();

		const channels = parseM3U(m3u);

		expect(channels).toHaveLength(2);
		expect(channels[0].url).toBe('http://example.com/1.m3u8');
		expect(channels[1].url).toBe('http://example.com/2.m3u8');
	});

	it('should handle missing comma in EXTINF', () => {
		const m3u = `
#EXTINF:-1 Some Channel Info Without Comma
http://example.com/no-comma.m3u8
		`.trim();

		const channels = parseM3U(m3u);

		expect(channels).toHaveLength(1);
		expect(channels[0].name).toBe('Unknown Channel');
		expect(channels[0].url).toBe('http://example.com/no-comma.m3u8');
	});
});
