import { describe, it, expect } from 'vitest';
import { computePreloadUrls } from './preloadManager';
import { ChannelStatus } from '$lib/types/channel';
import type { Channel } from '$lib/types/channel';

// Helper function to create dummy channels
function createChannels(statuses: ChannelStatus[]): Channel[] {
	return statuses.map((status, i) => ({
		id: i,
		name: `Channel ${i}`,
		url: `http://example.com/${i}`,
		status
	}));
}

describe('computePreloadUrls', () => {
	it('returns empty array if channels is empty', () => {
		expect(computePreloadUrls([], 0, null, '')).toEqual([]);
	});

	it('returns empty array if currentIndex is -1', () => {
		const channels = createChannels([ChannelStatus.Online]);
		expect(computePreloadUrls(channels, -1, null, '')).toEqual([]);
	});

	it('collects up to 5 previous and 5 next online channels sorted by distance', () => {
		const statuses = Array(15).fill(ChannelStatus.Online);
		const channels = createChannels(statuses);
		// Let currentIndex be 7.
		// Previous 5: 6, 5, 4, 3, 2
		// Next 5: 8, 9, 10, 11, 12
		const urls = computePreloadUrls(channels, 7, null, 'http://example.com/7');

		expect(urls).toHaveLength(10);
		// distance 1
		expect([urls[0], urls[1]]).toContain('http://example.com/6');
		expect([urls[0], urls[1]]).toContain('http://example.com/8');
		// distance 2
		expect([urls[2], urls[3]]).toContain('http://example.com/5');
		expect([urls[2], urls[3]]).toContain('http://example.com/9');
	});

	it('skips offline, pending, or checking channels', () => {
		const channels = createChannels([
			ChannelStatus.Online,   // 0
			ChannelStatus.Offline,  // 1
			ChannelStatus.Pending,  // 2
			ChannelStatus.Checking, // 3
			ChannelStatus.Online,   // 4 (current)
			ChannelStatus.Offline,  // 5
			ChannelStatus.Online    // 6
		]);
		const urls = computePreloadUrls(channels, 4, null, 'http://example.com/4');

		// Only 0 and 6 are online
		expect(urls).toEqual([
			'http://example.com/0', // previous distance 1
			'http://example.com/6'  // next distance 1
		]);
	});

	it('includes hovered URL at distance 0 if online and not already a candidate', () => {
		const channels = createChannels([
			ChannelStatus.Online, // 0
			ChannelStatus.Online, // 1 (current)
			ChannelStatus.Online, // 2
			ChannelStatus.Offline // 3
		]);
		// Add an online channel far away to be the hovered URL
		// We add enough online channels so that the hovered channel is not picked up as a candidate in the "next" loop
		for (let i = 4; i < 10; i++) {
			channels.push({
				id: i,
				name: `Channel ${i}`,
				url: `http://example.com/${i}`,
				status: ChannelStatus.Online
			});
		}

		channels.push({
			id: 100,
			name: 'Hovered',
			url: 'http://example.com/100',
			status: ChannelStatus.Online
		});

		const urls = computePreloadUrls(channels, 1, 'http://example.com/100', 'http://example.com/1');

		expect(urls[0]).toBe('http://example.com/100');
		expect(urls).toContain('http://example.com/0');
		expect(urls).toContain('http://example.com/2');
	});

	it('does not include hovered URL if it is the current stream URL', () => {
		const channels = createChannels([
			ChannelStatus.Online, // 0
			ChannelStatus.Online, // 1 (current)
			ChannelStatus.Online  // 2
		]);

		const urls = computePreloadUrls(channels, 1, 'http://example.com/1', 'http://example.com/1');

		expect(urls).not.toContain('http://example.com/1');
		expect(urls).toContain('http://example.com/0');
		expect(urls).toContain('http://example.com/2');
	});

	it('does not duplicate hovered URL if it is already a candidate', () => {
		const channels = createChannels([
			ChannelStatus.Online, // 0
			ChannelStatus.Online, // 1 (current)
			ChannelStatus.Online  // 2 (hovered and also next channel)
		]);

		const urls = computePreloadUrls(channels, 1, 'http://example.com/2', 'http://example.com/1');

		expect(urls.filter(u => u === 'http://example.com/2')).toHaveLength(1);
	});

	it('does not include hovered URL if it is offline', () => {
		const channels = createChannels([
			ChannelStatus.Online, // 0
			ChannelStatus.Online, // 1 (current)
			ChannelStatus.Offline // 2 (hovered)
		]);

		const urls = computePreloadUrls(channels, 1, 'http://example.com/2', 'http://example.com/1');

		expect(urls).not.toContain('http://example.com/2');
	});

	it('respects PRELOAD_LIMIT', () => {
		const statuses = Array(15).fill(ChannelStatus.Online);
		const channels = createChannels(statuses);

		const urls = computePreloadUrls(channels, 7, 'http://example.com/14', 'http://example.com/7');

		expect(urls).toHaveLength(10); // Since PRELOAD_LIMIT is 10
		expect(urls[0]).toBe('http://example.com/14'); // Hovered is distance 0
	});
});
