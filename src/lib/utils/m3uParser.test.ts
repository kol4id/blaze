import { describe, it, expect } from 'vitest';
import { parseM3U } from './m3uParser';
import { ChannelStatus } from '$lib/types/channel';

describe('parseM3U', () => {
	it('should return an empty array for empty or whitespace-only strings', () => {
		expect(parseM3U('')).toEqual([]);
		expect(parseM3U('   \n\t  ')).toEqual([]);
	});

	it('should parse standard M3U format with names and URLs', () => {
		const content = `
#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/stream1.m3u8
#EXTINF:-1 tvg-id="ch2",Channel 2
http://example.com/stream2.m3u8
		`.trim();

		const channels = parseM3U(content);
		expect(channels).toHaveLength(2);
		expect(channels[0]).toEqual({
			id: 0,
			name: 'Channel 1',
			url: 'http://example.com/stream1.m3u8',
			status: ChannelStatus.Pending
		});
		expect(channels[1]).toEqual({
			id: 1,
			name: 'Channel 2',
			url: 'http://example.com/stream2.m3u8',
			status: ChannelStatus.Pending
		});
	});

	it('should fallback to "Unknown Channel" when EXTINF tag is missing', () => {
		const content = `
http://example.com/stream1.m3u8
http://example.com/stream2.m3u8
		`.trim();

		const channels = parseM3U(content);
		expect(channels).toHaveLength(2);
		expect(channels[0]).toEqual({
			id: 0,
			name: 'Unknown Channel',
			url: 'http://example.com/stream1.m3u8',
			status: ChannelStatus.Pending
		});
		expect(channels[1]).toEqual({
			id: 1,
			name: 'Unknown Channel',
			url: 'http://example.com/stream2.m3u8',
			status: ChannelStatus.Pending
		});
	});

	it('should handle malformed EXTINF without a comma gracefully', () => {
		const content = `
#EXTINF:-1 Channel Without Comma
http://example.com/stream1.m3u8
		`.trim();

		const channels = parseM3U(content);
		expect(channels).toHaveLength(1);
		expect(channels[0].name).toBe('Unknown Channel');
	});

	it('should fallback to "Unnamed" when EXTINF has a comma but no name', () => {
		const content = `
#EXTINF:-1,
http://example.com/stream1.m3u8
#EXTINF:-1,
http://example.com/stream2.m3u8
		`.trim();

		const channels = parseM3U(content);
		expect(channels).toHaveLength(2);
		expect(channels[0].name).toBe('Unnamed');
		expect(channels[1].name).toBe('Unnamed');
	});

	it('should skip irrelevant M3U comments', () => {
		const content = `
#EXTM3U
#EXTVLCOPT:network-caching=1000
#EXTINF:-1,Channel 1
#EXTVLCOPT:http-reconnect=true
http://example.com/stream1.m3u8
		`.trim();

		const channels = parseM3U(content);
		expect(channels).toHaveLength(1);
		expect(channels[0].name).toBe('Channel 1');
		expect(channels[0].url).toBe('http://example.com/stream1.m3u8');
	});
});
