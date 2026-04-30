import { get, set, del, entries } from 'idb-keyval';
import type { Channel } from '$lib/types/channel';

const PLAYLIST_KEY_PREFIX = 'playlist_';
const LAST_PLAYLIST_KEY = 'last_playlist_id';

export interface SavedPlaylist {
	url: string;
	name?: string;
	channels: Channel[];
	timestamp: number;
	isFavorite?: boolean;
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
		.map(([, value]) => value as SavedPlaylist);
	return playlists.sort((a, b) => {
		if (a.isFavorite && !b.isFavorite) return -1;
		if (!a.isFavorite && b.isFavorite) return 1;
		return b.timestamp - a.timestamp;
	});
}

export async function togglePlaylistFavoriteLocally(url: string): Promise<void> {
	const existing = await getPlaylistLocally(url);
	if (existing) {
		const updatedPlaylist = {
			...existing,
			isFavorite: !existing.isFavorite,
			timestamp: Date.now() // Optional: update timestamp so it pops to top of favorites
		};
		await set(PLAYLIST_KEY_PREFIX + url, updatedPlaylist);
	}
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
