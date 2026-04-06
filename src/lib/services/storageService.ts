import { get, set, del, keys } from 'idb-keyval';
import type { Channel } from '$lib/types/channel';

const PLAYLIST_KEY_PREFIX = 'playlist_';
const LAST_PLAYLIST_KEY = 'last_playlist_id';

export interface SavedPlaylist {
	url: string;
	name?: string;
	channels: Channel[];
	timestamp: number;
}

export async function savePlaylistLocally(url: string, channels: Channel[], name?: string): Promise<void> {
	const existing = await getPlaylistLocally(url);
	await set(PLAYLIST_KEY_PREFIX + url, {
		url,
		name: name || existing?.name,
		channels,
		timestamp: Date.now()
	});
	await set(LAST_PLAYLIST_KEY, url);
}

export async function updatePlaylistNameLocally(url: string, name: string): Promise<void> {
	const existing = await getPlaylistLocally(url);
	if (existing) {
		await set(PLAYLIST_KEY_PREFIX + url, {
			...existing,
			name,
			timestamp: Date.now() // or preserve timestamp: existing.timestamp
		});
	}
}

export async function getPlaylistLocally(url: string): Promise<SavedPlaylist | undefined> {
	return get<SavedPlaylist>(PLAYLIST_KEY_PREFIX + url);
}

export async function getAllSavedPlaylistsLocally(): Promise<SavedPlaylist[]> {
	const allKeys = await keys();
	const playlistKeys = allKeys.filter((k) => typeof k === 'string' && k.startsWith(PLAYLIST_KEY_PREFIX));
	const playlists: SavedPlaylist[] = [];
	for (const key of playlistKeys) {
		const pl = await get<SavedPlaylist>(key as string);
		if (pl) playlists.push(pl);
	}
	return playlists.sort((a, b) => b.timestamp - a.timestamp);
}

export async function deletePlaylistLocally(url: string): Promise<void> {
	await del(PLAYLIST_KEY_PREFIX + url);
	const lastKey = await get<string>(LAST_PLAYLIST_KEY);
	if (lastKey === url) {
		await del(LAST_PLAYLIST_KEY);
	}
}

export async function getLastPlaylistUrlLocally(): Promise<string | undefined> {
	return get<string>(LAST_PLAYLIST_KEY);
}
