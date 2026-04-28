import { get, set, del, entries } from 'idb-keyval';
import type { Channel } from '$lib/types/channel';

const PLAYLIST_KEY_PREFIX = 'playlist_';
const LAST_PLAYLIST_KEY = 'last_playlist_id';

export interface SavedPlaylist {
	url: string;
	name?: string;
	channels: Channel[];
	timestamp: number;
}

export async function savePlaylistLocally(
	url: string,
	channels: Channel[],
	name?: string
): Promise<void> {
	const existing = await getPlaylistLocally(url);
	await set(PLAYLIST_KEY_PREFIX + url, {
		url,
		name: name || existing?.name,
		channels,
		timestamp: Date.now()
	});
	await set(LAST_PLAYLIST_KEY, url);
}

export async function updatePlaylistDataLocally(
	oldUrl: string,
	newUrl: string,
	newName: string
): Promise<void> {
	const existing = await getPlaylistLocally(oldUrl);
	if (existing) {
		const updatedPlaylist = {
			...existing,
			url: newUrl,
			name: newName,
			timestamp: Date.now()
		};

		if (oldUrl !== newUrl) {
			await del(PLAYLIST_KEY_PREFIX + oldUrl);
			// Also update last playlist if it was this one
			const lastKey = await get<string>(LAST_PLAYLIST_KEY);
			if (lastKey === oldUrl) {
				await set(LAST_PLAYLIST_KEY, newUrl);
			}
		}

		await set(PLAYLIST_KEY_PREFIX + newUrl, updatedPlaylist);
	}
}

export async function getPlaylistLocally(url: string): Promise<SavedPlaylist | undefined> {
	return get<SavedPlaylist>(PLAYLIST_KEY_PREFIX + url);
}

export async function getAllSavedPlaylistsLocally(): Promise<SavedPlaylist[]> {
	const allEntries = await entries();
	const playlists: SavedPlaylist[] = allEntries
		.filter(
			([key, value]) =>
				typeof key === 'string' && key.startsWith(PLAYLIST_KEY_PREFIX) && value !== undefined
		)
		.map(([_, value]) => value as SavedPlaylist);
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
