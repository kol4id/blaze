import { performance } from 'perf_hooks';

const store = new Map();
for (let i = 0; i < 1000; i++) {
	store.set(`playlist_${i}`, { url: `url_${i}`, channels: [], timestamp: i });
}
store.set('other', 'thing');

const keys = async () => Array.from(store.keys());
const get = async (key) => new Promise((resolve) => setTimeout(() => resolve(store.get(key)), 1)); // 1ms delay to simulate I/O

const PLAYLIST_KEY_PREFIX = 'playlist_';

async function getAllSavedPlaylistsLocally_Old() {
	const allKeys = await keys();
	const playlistKeys = allKeys.filter(
		(k) => typeof k === 'string' && k.startsWith(PLAYLIST_KEY_PREFIX)
	);
	const playlists = [];
	for (const key of playlistKeys) {
		const pl = await get(key);
		if (pl) playlists.push(pl);
	}
	return playlists.sort((a, b) => b.timestamp - a.timestamp);
}

async function getAllSavedPlaylistsLocally_New() {
	const allKeys = await keys();
	const playlistKeys = allKeys.filter(
		(k) => typeof k === 'string' && k.startsWith(PLAYLIST_KEY_PREFIX)
	);
	const playlists = await Promise.all(playlistKeys.map((key) => get(key)));
	return playlists.filter((pl) => pl !== undefined).sort((a, b) => b.timestamp - a.timestamp);
}

async function run() {
	const start1 = performance.now();
	await getAllSavedPlaylistsLocally_Old();
	const end1 = performance.now();
	console.log('Old:', end1 - start1, 'ms');

	const start2 = performance.now();
	await getAllSavedPlaylistsLocally_New();
	const end2 = performance.now();
	console.log('New:', end2 - start2, 'ms');
}

run();
