<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import {
		channelsStore,
		currentStreamUrlStore,
		currentIndexStore,
		isLoadingPlaylistStore,
		loadPlaylist,
		loadLastPlaylist,
		playChannelByIndex,
		setHoveredUrl,
		getPreloadUrls
	} from '$lib/stores/channelStore';
	import { ChannelStatus } from '$lib/types/channel';
	import type { Channel } from '$lib/types/channel';
	import { HOVER_PRELOAD_DELAY_MS } from '$lib/utils/constants';
	import { findNextAvailableChannel, findFirstOnlineChannel } from '$lib/utils/channelNavigation';

	import Header from '$lib/components/Header.svelte';
	import ChannelList from '$lib/components/ChannelList.svelte';
	import PlayerArea from '$lib/components/PlayerArea.svelte';
	import PlaylistCards from '$lib/components/PlaylistCards.svelte';

	let channels = $state<Channel[]>([]);
	let currentStreamUrl = $state('');
	let currentIndex = $state(-1);
	let isLoadingList = $state(false);

	const unsubs = [
		channelsStore.subscribe((v) => (channels = v)),
		currentStreamUrlStore.subscribe((v) => (currentStreamUrl = v)),
		currentIndexStore.subscribe((v) => (currentIndex = v)),
		isLoadingPlaylistStore.subscribe((v) => (isLoadingList = v))
	];

	let preloadUrls = $derived(getPreloadUrls());
	let hoverTimer: number | undefined;

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;

		// Allow normal remote-control navigation if focusing on interactive elements
		const active = document.activeElement;
		if (active) {
			const tag = active.tagName;
			if (
				tag === 'INPUT' ||
				tag === 'SELECT' ||
				active.closest('header') ||
				active.closest('.playlist-cards-container')
			) {
				// We don't hijack if the user is explicitly focused on input forms or playlist selection
				return;
			}
		}

		event.preventDefault();
		const dir = event.key === 'ArrowUp' ? 'up' : 'down';
		if (currentIndex === -1) {
			const first = findFirstOnlineChannel(channels);
			if (first !== -1) playChannelByIndex(first);
		} else {
			const next = findNextAvailableChannel(channels, currentIndex, dir);
			if (next !== -1) playChannelByIndex(next);
		}
	}

	async function onLoadPlaylist(url: string, name?: string) {
		if (!url) return;
		try {
			await loadPlaylist(url, false, name);
		} catch (err) {
			alert(`Failed to load playlist: ${err instanceof Error ? err.message : 'Unknown error'}`);
		}
	}

	function handleHoverStart(url: string, status: ChannelStatus) {
		if (status !== ChannelStatus.Online) return;
		clearTimeout(hoverTimer);
		hoverTimer = setTimeout(() => {
			setHoveredUrl(url);
		}, HOVER_PRELOAD_DELAY_MS) as unknown as number;
	}

	function handleHoverEnd() {
		clearTimeout(hoverTimer);
		setHoveredUrl(null);
	}

	onMount(() => {
		window.addEventListener('keydown', handleKeydown);
		loadLastPlaylist();
	});
	onDestroy(() => {
		unsubs.forEach((u) => u());
		if (browser) {
			window.removeEventListener('keydown', handleKeydown);
		}
		clearTimeout(hoverTimer);
	});
</script>

<main>
	<Header isLoading={isLoadingList} onloadplaylist={onLoadPlaylist} />
	<div class="layout">
		{#if channels.length === 0 && !isLoadingList}
			<PlaylistCards onselect={onLoadPlaylist} />
		{:else}
			<ChannelList
				{channels}
				{currentStreamUrl}
				{isLoadingList}
				onselect={playChannelByIndex}
				onhoverstart={handleHoverStart}
				onhoverend={handleHoverEnd}
			/>
			<PlayerArea {currentStreamUrl} {preloadUrls} />
		{/if}
	</div>
</main>

<style lang="scss">
	@use '$lib/styles/abstracts' as *;
	main {
		height: calc(100vh - #{$spacing-lg * 2});
		display: flex;
		flex-direction: column;
		padding: 0; // padding inside body via global.scss
		overflow: hidden;
	}
	.layout {
		display: flex;
		gap: $spacing-md;
		flex-grow: 1;
		min-height: 0;
	}
</style>
