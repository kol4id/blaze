import { describe, it, expect } from 'vitest';
import { computePreloadUrls } from './preloadManager';
import { ChannelStatus } from '$lib/types/channel';
import type { Channel } from '$lib/types/channel';

// Helper function to create mock channels
const createChannels = (count: number, offlineIndices: number[] = []): Channel[] => {
	return Array.from({ length: count }).map((_, i) => ({
		id: i,
		name: `Channel ${i}`,
		url: `url_${i}`,
		status: offlineIndices.includes(i) ? ChannelStatus.Offline : ChannelStatus.Online
	}));
};

describe('computePreloadUrls', () => {
	it('should return empty array if current index is -1', () => {
		const channels = createChannels(5);
		const result = computePreloadUrls(channels, -1, null, 'url_1');
		expect(result).toEqual([]);
	});

	it('should return empty array if channels are empty', () => {
		const result = computePreloadUrls([], 0, null, 'url_1');
		expect(result).toEqual([]);
	});

	it('should pick up to 5 before and 5 after the current channel correctly prioritized by distance', () => {
		const channels = createChannels(15);
		// Let's say current index is 7
		// Before: 6, 5, 4, 3, 2 (distances 1, 2, 3, 4, 5)
		// After: 8, 9, 10, 11, 12 (distances 1, 2, 3, 4, 5)
		const result = computePreloadUrls(channels, 7, null, 'url_7');

		// The function sorts by distance
		// Candidates are pushed in order of iteration
		// Before: {url_6: 1}, {url_5: 2}, {url_4: 3}, {url_3: 4}, {url_2: 5}
		// After: {url_8: 1}, {url_9: 2}, {url_10: 3}, {url_11: 4}, {url_12: 5}
		// So distances are: 1, 1, 2, 2, 3, 3, 4, 4, 5, 5
		expect(result).toHaveLength(10);
		// Distance 1
		expect(result.slice(0, 2)).toContain('url_6');
		expect(result.slice(0, 2)).toContain('url_8');
		// Distance 2
		expect(result.slice(2, 4)).toContain('url_5');
		expect(result.slice(2, 4)).toContain('url_9');
		// Distance 5
		expect(result.slice(8, 10)).toContain('url_2');
		expect(result.slice(8, 10)).toContain('url_12');
	});

	it('should skip offline channels', () => {
		// Index 2 is offline
		const channels = createChannels(5, [2]);
		// Current is 3
		// Before: 2 (offline), 1, 0. Should only get 1 and 0.
		// After: 4. Should get 4.
		const result = computePreloadUrls(channels, 3, null, 'url_3');
		expect(result).not.toContain('url_2');
		expect(result).toContain('url_4'); // distance 1
		expect(result).toContain('url_1'); // distance 1 (1st online before 3)
		expect(result).toContain('url_0'); // distance 2 (2nd online before 3)
	});

	it('should prioritize hoveredUrl with distance 0 if not current stream and not already in candidates', () => {
		// Current index 5
		// Candidates around 5: 4, 3, 2, 1, 0 (before) and 6, 7, 8, 9 (after)
		// Since count is up to 5, after will be 6, 7, 8, 9.
		// Actually, wait, let's make hoveredUrl outside the immediate 5.
		// Let's use 20 channels.
		const largeChannels = createChannels(20);
		// Current index 5
		// After: 6, 7, 8, 9, 10
		// Hovered: url_15
		const result = computePreloadUrls(largeChannels, 5, 'url_15', 'url_5');

		// Expected: hoveredUrl should be first (distance 0)
		expect(result[0]).toBe('url_15');
		expect(result).toContain('url_6');
		expect(result.length).toBeLessThanOrEqual(10); // PRELOAD_LIMIT is 10
	});

	it('should handle hoveredUrl if it is already in the candidates', () => {
		const channels = createChannels(10);
		// Current is 5. After includes 6.
		// Hover hoveredUrl is url_6.
		// It is already in candidates, so it shouldn't add a duplicate with distance 0.
		// It will just remain at its natural distance.
		const result = computePreloadUrls(channels, 5, 'url_6', 'url_5');

		// url_6 should be in result exactly once
		const count = result.filter((u) => u === 'url_6').length;
		expect(count).toBe(1);
	});

	it('should not include hoveredUrl if it is the current stream', () => {
		const channels = createChannels(10);
		// Current is 5.
		// Hovered is url_5.
		// Current stream is url_5.
		const result = computePreloadUrls(channels, 5, 'url_5', 'url_5');

		expect(result).not.toContain('url_5');
	});

	it('should not include hoveredUrl if hovered channel is offline', () => {
		const channels = createChannels(20, [15]); // 15 is offline
		// Current index 5. Hovered 15.
		const result = computePreloadUrls(channels, 5, 'url_15', 'url_5');

		expect(result).not.toContain('url_15');
	});

	it('should respect PRELOAD_LIMIT', () => {
		const channels = createChannels(30);
		// Current 10.
		// Before: 9, 8, 7, 6, 5
		// After: 11, 12, 13, 14, 15
		// Hover: 20
		// Total candidates = 5 + 5 + 1 = 11
		// PRELOAD_LIMIT = 10
		const result = computePreloadUrls(channels, 10, 'url_20', 'url_10');
		expect(result.length).toBe(10);

		// The furthest ones (distance 5) might be cut off.
		// Hovered is distance 0, so it must be included.
		expect(result[0]).toBe('url_20');
	});
});
