import type { Channel } from '$lib/types/channel';
import { ChannelStatus } from '$lib/types/channel';
import { HEALTH_CHECK_TIMEOUT_MS, HEALTH_CHECK_CONCURRENCY } from '$lib/utils/constants';

async function isStreamOnline(url: string): Promise<boolean> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}&range=bytes=0-100`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);

  try {
    const res = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch {
    clearTimeout(timeoutId);
    return false;
  }
}

export async function checkAllChannelsHealth(
  channels: Channel[],
  onStatusUpdate: (index: number, newStatus: ChannelStatus) => void
): Promise<void> {
  let currentIndex = 0;

  const worker = async () => {
    while (currentIndex < channels.length) {
      const idx = currentIndex++;
      const channel = channels[idx];
      onStatusUpdate(idx, ChannelStatus.Checking);

      const isOnline = await isStreamOnline(channel.url);
      const newStatus = isOnline ? ChannelStatus.Online : ChannelStatus.Offline;
      onStatusUpdate(idx, newStatus);
    }
  };

  const workers = Array(HEALTH_CHECK_CONCURRENCY).fill(null).map(() => worker());
  await Promise.all(workers);
}