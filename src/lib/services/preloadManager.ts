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

  for (let offset = 1; offset <= 5; offset++) {
    const upIdx = currentIndex - offset;
    if (upIdx >= 0 && channels[upIdx].status === ChannelStatus.Online) {
      candidates.push({ url: channels[upIdx].url, distance: offset });
    }
    const downIdx = currentIndex + offset;
    if (downIdx < channels.length && channels[downIdx].status === ChannelStatus.Online) {
      candidates.push({ url: channels[downIdx].url, distance: offset });
    }
  }

  if (
    hoveredUrl &&
    hoveredUrl !== currentStreamUrl &&
    !candidates.some(c => c.url === hoveredUrl)
  ) {
    const hoverChannel = channels.find(c => c.url === hoveredUrl);
    if (hoverChannel?.status === ChannelStatus.Online) {
      candidates.push({ url: hoveredUrl, distance: 0 });
    }
  }

  const sorted = [...candidates].sort((a, b) => a.distance - b.distance);
  return sorted.slice(0, PRELOAD_LIMIT).map(c => c.url);
}