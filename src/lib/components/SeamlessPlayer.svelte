<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import type Hls from 'hls.js';
	import { TOTAL_PLAYER_SLOTS } from '$lib/utils/constants';

	let { currentSrc = '', preloadSrcs = [] } = $props();

	let videos: HTMLVideoElement[] = [];
	let hlsInstances: (Hls | null)[] = new Array(TOTAL_PLAYER_SLOTS).fill(null);
	let loadedUrls: string[] = new Array(TOTAL_PLAYER_SLOTS).fill('');
	let activeIndex = $state(0);
	let errorMessage = $state('');
	let HlsModule: typeof Hls | null = null;
	let ready = $state(false);

	function initPlayer(
		video: HTMLVideoElement,
		url: string,
		muted: boolean,
		slot: number
	): Hls | null {
		if (!HlsModule) return null;
		video.muted = muted;
		loadedUrls[slot] = url;

		if (HlsModule.isSupported()) {
			const hls = new HlsModule({ maxMaxBufferLength: 10, enableWorker: true });
			hls.on(HlsModule.Events.ERROR, (_, data) => {
				if (data.fatal && !muted) {
					errorMessage =
						data.type === HlsModule!.ErrorTypes.NETWORK_ERROR
							? 'Stream unavailable (network/CORS)'
							: 'Video decoding error';
				}
			});
			hls.loadSource(url);
			hls.attachMedia(video);
			hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
				video.play().catch((err) => {
					if (!muted && err.name !== 'AbortError') errorMessage = 'Autoplay blocked';
				});
			});
			return hls;
		} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
			video.src = url;
			video.addEventListener('loadedmetadata', () => {
				video.play().catch(() => {});
			});
			return null;
		} else {
			errorMessage = 'HLS not supported';
			return null;
		}
	}

	function stopPlayer(slot: number): void {
		if (hlsInstances[slot]) {
			hlsInstances[slot]!.destroy();
			hlsInstances[slot] = null;
		}
		if (videos[slot]) {
			videos[slot].pause();
			videos[slot].removeAttribute('src');
			videos[slot].load();
		}
		loadedUrls[slot] = '';
	}

	function reconcilePlayers(targetSrc: string, preloads: string[]): void {
		errorMessage = '';
		if (!targetSrc) return;

		const desiredUrls = Array.from(new Set([targetSrc, ...preloads].filter(Boolean)));
		const urlsToLoad = desiredUrls.slice(0, TOTAL_PLAYER_SLOTS);

		// 1. Evict slots that hold URLs no longer desired
		for (let i = 0; i < TOTAL_PLAYER_SLOTS; i++) {
			if (loadedUrls[i] && !urlsToLoad.includes(loadedUrls[i])) {
				stopPlayer(i);
			}
		}

		// 2. Ensure targetSrc is loaded
		let nextActiveIdx = loadedUrls.indexOf(targetSrc);
		if (nextActiveIdx === -1) {
			nextActiveIdx = loadedUrls.findIndex((u) => !u);
			if (nextActiveIdx !== -1) {
				hlsInstances[nextActiveIdx] = initPlayer(videos[nextActiveIdx], targetSrc, false, nextActiveIdx);
			}
		}

		// 3. Update active player state
		if (nextActiveIdx !== -1) {
			if (activeIndex !== nextActiveIdx) {
				// Mute the old active player if it's still alive (became a preload)
				if (loadedUrls[activeIndex]) {
					videos[activeIndex].muted = true;
				}
				activeIndex = nextActiveIdx;
			}
			videos[activeIndex].muted = false;
			videos[activeIndex].play().catch((err) => {
				if (err.name !== 'AbortError') errorMessage = 'Autoplay blocked';
			});
		}

		// 4. Load remaining preloads into empty slots
		for (const url of urlsToLoad) {
			if (url !== targetSrc && !loadedUrls.includes(url)) {
				const emptyIdx = loadedUrls.findIndex((u) => !u);
				if (emptyIdx !== -1) {
					hlsInstances[emptyIdx] = initPlayer(videos[emptyIdx], url, true, emptyIdx);
				}
			}
		}
	}

	onMount(async () => {
		const mod = await import('hls.js');
		HlsModule = mod.default;
		ready = true;
	});

	$effect(() => {
		if (ready && currentSrc && videos.length === TOTAL_PLAYER_SLOTS && videos.every((v) => v)) {
			reconcilePlayers(currentSrc, preloadSrcs);
		}
	});

	onDestroy(() => {
		if (browser) {
			for (let i = 0; i < TOTAL_PLAYER_SLOTS; i++) stopPlayer(i);
		}
	});
</script>

<div class="video-container">
	{#if errorMessage}
		<div class="error-overlay">{errorMessage}</div>
	{/if}
	<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
	{#each Array.from({ length: TOTAL_PLAYER_SLOTS }) as _, idx (idx)}
		<video
			bind:this={videos[idx]}
			class="player {idx === activeIndex ? 'active' : 'hidden'}"
			controls={idx === activeIndex}
		></video>
	{/each}
</div>

<style lang="scss">
	@use "$lib/styles/abstracts" as *;
	.video-container {
		position: relative;
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #000;
		border-radius: $radius-md;
		overflow: hidden;
	}
	.player {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		transition: opacity $transition-fast;
	}
	.active {
		opacity: 1;
		z-index: 2;
		pointer-events: auto;
	}
	.hidden {
		opacity: 0;
		z-index: 1;
		pointer-events: none;
	}
	.error-overlay {
		position: absolute;
		inset: 0;
		background: $color-overlay;
		color: $color-error;
		@include flex-center;
		z-index: 10;
		font-family: $font-mono;
		font-size: $fs-sm;
	}
</style>
