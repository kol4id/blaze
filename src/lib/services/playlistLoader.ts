import type { Channel } from '$lib/types/channel';
import { parseM3U } from '$lib/utils/m3uParser';

export async function loadPlaylistFromUrl(playlistUrl: string): Promise<Channel[]> {
  const proxyUrl = `/api/proxy?url=${encodeURIComponent(playlistUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) {
    throw new Error(`Failed to load playlist: ${response.status} ${response.statusText}`);
  }
  const content = await response.text();
  return parseM3U(content);
}