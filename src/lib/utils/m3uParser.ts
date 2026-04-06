import type { Channel } from '$lib/types/channel';
import { ChannelStatus } from '$lib/types/channel';

export function parseM3U(content: string): Channel[] {
	const lines = content.split(/\r?\n/);
	const channels: Channel[] = [];
	let currentName = 'Unknown Channel';
	let id = 0;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		if (trimmed.startsWith('#EXTINF:')) {
			const commaIndex = trimmed.lastIndexOf(',');
			if (commaIndex !== -1) {
				currentName = trimmed.substring(commaIndex + 1).trim();
			}
		} else if (!trimmed.startsWith('#')) {
			channels.push({
				id: id++,
				name: currentName || 'Unnamed',
				url: trimmed,
				status: ChannelStatus.Pending
			});
			currentName = 'Unknown Channel';
		}
	}
	return channels;
}
