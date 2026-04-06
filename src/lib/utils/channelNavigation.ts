import type { Channel, Direction } from '$lib/types/channel';
import { ChannelStatus } from '$lib/types/channel';

export function findNextAvailableChannel(
	channels: Channel[],
	currentIndex: number,
	direction: Direction
): number {
	const step = direction === 'up' ? -1 : 1;
	let idx = currentIndex + step;
	while (idx >= 0 && idx < channels.length) {
		if (channels[idx].status === ChannelStatus.Online) return idx;
		idx += step;
	}
	return -1;
}

export function findFirstOnlineChannel(channels: Channel[]): number {
	return channels.findIndex((c) => c.status === ChannelStatus.Online);
}
