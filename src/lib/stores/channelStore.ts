import { writable, derived, type Readable, type Writable } from 'svelte/store';
import type { Channel } from '../types/channel';
import { ChannelStatus } from '../types/channel';
import { loadPlaylistFromUrl } from '../services/playlistLoader';
import { checkAllChannelsHealth } from '../services/healthChecker';
import { computePreloadUrls } from '../utils/preloadManager';
import {
	savePlaylistLocally,
	getPlaylistLocally,
	getLastPlaylistUrlLocally
} from '../services/storageService';

interface ChannelStoreState {
	channels: Channel[];
	currentIndex: number;
	currentStreamUrl: string;
	hoveredUrl: string | null;
	isLoadingPlaylist: boolean;
	isHealthCheckRunning: boolean;
}

const initialState: ChannelStoreState = {
	channels: [],
	currentIndex: -1,
	currentStreamUrl: '',
	hoveredUrl: null,
	isLoadingPlaylist: false,
	isHealthCheckRunning: false
};

const store: Writable<ChannelStoreState> = writable(initialState);

export const channelsStore: Readable<Channel[]> = derived(store, ($state) => $state.channels);
export const currentStreamUrlStore: Readable<string> = derived(
	store,
	($state) => $state.currentStreamUrl
);
export const currentIndexStore: Readable<number> = derived(store, ($state) => $state.currentIndex);
export const hoveredUrlStore: Readable<string | null> = derived(
	store,
	($state) => $state.hoveredUrl
);
export const isLoadingPlaylistStore: Readable<boolean> = derived(
	store,
	($state) => $state.isLoadingPlaylist
);

function getCurrentState(): ChannelStoreState {
	let result: ChannelStoreState = initialState;
	store.subscribe((s) => {
		result = s;
	})();
	return result;
}

export async function loadPlaylist(
	url: string,
	forceRefresh = false,
	name?: string
): Promise<void> {
	store.update((state) => ({ ...state, isLoadingPlaylist: true }));
	try {
		let channels: Channel[] | undefined;

		if (!forceRefresh) {
			const cached = await getPlaylistLocally(url);
			if (cached) channels = cached.channels;
		}

		if (!channels) {
			channels = await loadPlaylistFromUrl(url);
		}

		// Always save if we have channels, so that the name gets updated even if from cache
		if (channels && (name || !forceRefresh)) {
			await savePlaylistLocally(url, channels, name);
		}

		store.update((state) => ({
			...state,
			channels: channels as Channel[],
			currentIndex: -1,
			currentStreamUrl: '',
			isLoadingPlaylist: false
		}));
		await runHealthCheck();
	} catch (err) {
		console.error('Playlist loading failed:', err);
		store.update((state) => ({ ...state, isLoadingPlaylist: false }));
		throw err;
	}
}

export async function loadLastPlaylist(): Promise<void> {
	try {
		const lastUrl = await getLastPlaylistUrlLocally();
		if (lastUrl) {
			await loadPlaylist(lastUrl);
		}
	} catch (e) {
		console.error('Failed to load last playlist', e);
	}
}

let healthCheckController: AbortController | null = null;

async function runHealthCheck(): Promise<void> {
	let currentState = getCurrentState();
	if (currentState.channels.length === 0) return;

	if (healthCheckController) {
		healthCheckController.abort();
		healthCheckController = null;
	}

	healthCheckController = new AbortController();
	const signal = healthCheckController.signal;

	store.update((state) => ({ ...state, isHealthCheckRunning: true }));
	currentState = getCurrentState();

	await checkAllChannelsHealth(
		currentState.channels,
		(index, newStatus) => {
			if (signal.aborted) return;
			store.update((state) => {
				const newChannels = [...state.channels];
				if (newChannels[index]) newChannels[index] = { ...newChannels[index], status: newStatus };
				return { ...state, channels: newChannels };
			});
		},
		signal
	);

	if (!signal.aborted) {
		store.update((state) => {
			const { channels, currentIndex, currentStreamUrl } = state;
			let newCurrentIndex = currentIndex;
			let newCurrentStreamUrl = currentStreamUrl;

			if (
				newCurrentIndex !== -1 &&
				(!channels[newCurrentIndex] || channels[newCurrentIndex].status !== ChannelStatus.Online)
			) {
				const firstOnlineIdx = channels.findIndex((c) => c.status === ChannelStatus.Online);
				if (firstOnlineIdx !== -1) {
					newCurrentIndex = firstOnlineIdx;
					newCurrentStreamUrl = channels[firstOnlineIdx].url;
				} else {
					newCurrentIndex = -1;
					newCurrentStreamUrl = '';
				}
			}
			return {
				...state,
				currentIndex: newCurrentIndex,
				currentStreamUrl: newCurrentStreamUrl,
				isHealthCheckRunning: false
			};
		});
		if (healthCheckController?.signal === signal) {
			healthCheckController = null;
		}
	}
}

export function playChannelByIndex(index: number): void {
	const state = getCurrentState();
	const channel = state.channels[index];
	if (!channel || channel.status !== ChannelStatus.Online) return;
	store.update((state) => ({ ...state, currentIndex: index, currentStreamUrl: channel.url }));
}

export function setHoveredUrl(url: string | null): void {
	store.update((state) => ({ ...state, hoveredUrl: url }));
}

export function getPreloadUrls(): string[] {
	const state = getCurrentState();
	return computePreloadUrls(
		state.channels,
		state.currentIndex,
		state.hoveredUrl,
		state.currentStreamUrl
	);
}
