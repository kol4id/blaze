import { describe, it, expect } from 'vitest';
import { findNextAvailableChannel, findFirstOnlineChannel } from './channelNavigation';
import { ChannelStatus, type Channel } from '../types/channel';

describe('findNextAvailableChannel', () => {
	const createChannel = (id: number, status: ChannelStatus): Channel => ({
		id,
		name: `Channel ${id}`,
		url: `http://example.com/${id}`,
		status
	});

	const channels: Channel[] = [
		createChannel(1, ChannelStatus.Offline),
		createChannel(2, ChannelStatus.Pending),
		createChannel(3, ChannelStatus.Online),
		createChannel(4, ChannelStatus.Checking),
		createChannel(5, ChannelStatus.Online),
		createChannel(6, ChannelStatus.Offline)
	];

	it('should find the next available channel going up (previous channel)', () => {
		// currentIndex is 4 (Channel 5), step is -1 (up), expecting index 2 (Channel 3)
		const result = findNextAvailableChannel(channels, 4, 'up');
		expect(result).toBe(2);
	});

	it('should find the next available channel going down (next channel)', () => {
		// currentIndex is 1 (Channel 2), step is +1 (down), expecting index 2 (Channel 3)
		const result = findNextAvailableChannel(channels, 1, 'down');
		expect(result).toBe(2);
	});

	it('should return -1 when going up and no available online channels exist', () => {
		// currentIndex is 2 (Channel 3), expecting -1 because channels 1 and 2 are not online
		const result = findNextAvailableChannel(channels, 2, 'up');
		expect(result).toBe(-1);
	});

	it('should return -1 when going down and no available online channels exist', () => {
		// currentIndex is 4 (Channel 5), expecting -1 because channel 6 is offline
		const result = findNextAvailableChannel(channels, 4, 'down');
		expect(result).toBe(-1);
	});

	it('should return -1 when starting at the first element and going up', () => {
		// currentIndex is 0, up goes out of bounds
		const result = findNextAvailableChannel(channels, 0, 'up');
		expect(result).toBe(-1);
	});

	it('should return -1 when starting at the last element and going down', () => {
		// currentIndex is 5, down goes out of bounds
		const result = findNextAvailableChannel(channels, 5, 'down');
		expect(result).toBe(-1);
	});

	it('should return -1 when all channels are offline', () => {
		const offlineChannels = channels.map((c) => ({ ...c, status: ChannelStatus.Offline }));
		expect(findNextAvailableChannel(offlineChannels, 2, 'up')).toBe(-1);
		expect(findNextAvailableChannel(offlineChannels, 2, 'down')).toBe(-1);
	});

	it('should handle currentIndex out of bounds (negative)', () => {
		// If currentIndex is -1, going up: starts at -2 (out of bounds)
		expect(findNextAvailableChannel(channels, -1, 'up')).toBe(-1);
		// If currentIndex is -1, going down: starts at 0, first online is index 2
		expect(findNextAvailableChannel(channels, -1, 'down')).toBe(2);
	});

	it('should handle currentIndex out of bounds (beyond length)', () => {
		// If currentIndex is 6, going down: starts at 7 (out of bounds)
		expect(findNextAvailableChannel(channels, 6, 'down')).toBe(-1);
		// If currentIndex is 6, going up: starts at 5, first online is index 4
		expect(findNextAvailableChannel(channels, 6, 'up')).toBe(4);
	});

	it('should return -1 for empty channel array', () => {
		expect(findNextAvailableChannel([], 0, 'up')).toBe(-1);
		expect(findNextAvailableChannel([], 0, 'down')).toBe(-1);
	});
});

describe('findFirstOnlineChannel', () => {
	const createChannel = (id: number, status: ChannelStatus): Channel => ({
		id,
		name: `Channel ${id}`,
		url: `http://example.com/${id}`,
		status
	});

	it('should return the index of the first online channel', () => {
		const channels = [
			createChannel(1, ChannelStatus.Offline),
			createChannel(2, ChannelStatus.Online),
			createChannel(3, ChannelStatus.Online)
		];
		expect(findFirstOnlineChannel(channels)).toBe(1);
	});

	it('should return -1 if no online channel exists', () => {
		const channels = [
			createChannel(1, ChannelStatus.Offline),
			createChannel(2, ChannelStatus.Pending)
		];
		expect(findFirstOnlineChannel(channels)).toBe(-1);
	});

	it('should return -1 for an empty array', () => {
		expect(findFirstOnlineChannel([])).toBe(-1);
	});
});
