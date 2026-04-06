import type { Channel } from '$lib/types/channel';
import { ChannelStatus } from '$lib/types/channel';
import { PRELOAD_LIMIT } from '$lib/utils/constants';

export function computePreloadUrls(
	channels: Channel[],
	currentIndex: number,
	hoveredUrl: string | null,
	currentStreamUrl: string
): string[] {
	if (currentIndex === -1 || channels.length === 0) return [];

	const candidates: { url: string; distance: number }[] = [];

	let count = 0;
	for (let i = currentIndex - 1; i >= 0 && count < 5; i--) {
		if (channels[i].status === ChannelStatus.Online) {
			count++;
			candidates.push({ url: channels[i].url, distance: count });
		}
	}

	count = 0;
	for (let i = currentIndex + 1; i < channels.length && count < 5; i++) {
		if (channels[i].status === ChannelStatus.Online) {
			count++;
			candidates.push({ url: channels[i].url, distance: count });
		}
	}

	if (
		hoveredUrl &&
		hoveredUrl !== currentStreamUrl &&
		!candidates.some((c) => c.url === hoveredUrl)
	) {
		const hoverChannel = channels.find((c) => c.url === hoveredUrl);
		if (hoverChannel?.status === ChannelStatus.Online) {
			candidates.push({ url: hoveredUrl, distance: 0 });
		}
	}

	const sorted = [...candidates].sort((a, b) => a.distance - b.distance);
	return sorted.slice(0, PRELOAD_LIMIT).map((c) => c.url);
}
