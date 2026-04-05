<script lang="ts">
  import { onDestroy } from 'svelte';
  import Hls from 'hls.js';
  import { TOTAL_PLAYER_SLOTS } from '$lib/utils/constants';

  let { currentSrc = '', preloadSrcs = [] } = $props();

  let videos: HTMLVideoElement[] = [];
  let hlsInstances: (Hls | null)[] = new Array(TOTAL_PLAYER_SLOTS).fill(null);
  let loadedUrls: string[] = new Array(TOTAL_PLAYER_SLOTS).fill('');
  let activeIndex = $state(0);
  let errorMessage = $state('');

  function initPlayer(video: HTMLVideoElement, url: string, muted: boolean, slot: number): Hls | null {
    video.muted = muted;
    loadedUrls[slot] = url;

    if (Hls.isSupported()) {
      const hls = new Hls({ maxMaxBufferLength: 10, enableWorker: true });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal && !muted) {
          errorMessage = data.type === Hls.ErrorTypes.NETWORK_ERROR
            ? 'Stream unavailable (network/CORS)'
            : 'Video decoding error';
        }
      });
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!muted) video.play().catch(() => errorMessage = 'Autoplay blocked');
      });
      return hls;
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        if (!muted) video.play().catch(() => {});
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

  function switchToCurrent(src: string): void {
    errorMessage = '';
    if (loadedUrls[activeIndex] === src) return;

    const preloadedSlot = loadedUrls.findIndex((url, idx) => url === src && idx !== activeIndex);
    if (preloadedSlot !== -1) {
      stopPlayer(activeIndex);
      activeIndex = preloadedSlot;
      videos[activeIndex].muted = false;
      videos[activeIndex].play().catch(() => {});
      for (let i = 0; i < TOTAL_PLAYER_SLOTS; i++) {
        if (i !== activeIndex) stopPlayer(i);
      }
    } else {
      stopPlayer(activeIndex);
      hlsInstances[activeIndex] = initPlayer(videos[activeIndex], src, false, activeIndex);
    }
  }

  function preloadUrls(urls: string[]): void {
    const freeSlots: number[] = [];
    for (let i = 0; i < TOTAL_PLAYER_SLOTS; i++) {
      if (i !== activeIndex) freeSlots.push(i);
    }
    for (let i = 0; i < Math.min(urls.length, freeSlots.length); i++) {
      const url = urls[i];
      const slot = freeSlots[i];
      if (loadedUrls.includes(url) || url === currentSrc) continue;
      if (url) {
        stopPlayer(slot);
        hlsInstances[slot] = initPlayer(videos[slot], url, true, slot);
      }
    }
  }

  $effect(() => {
    if (currentSrc && videos.length === TOTAL_PLAYER_SLOTS && videos.every(v => v)) {
      switchToCurrent(currentSrc);
    }
  });

  $effect(() => {
    if (preloadSrcs && videos.length === TOTAL_PLAYER_SLOTS && videos.every(v => v)) {
      preloadUrls(preloadSrcs);
    }
  });

  onDestroy(() => {
    for (let i = 0; i < TOTAL_PLAYER_SLOTS; i++) stopPlayer(i);
  });
</script>

<div class="video-container">
  {#if errorMessage}
    <div class="error-overlay">{errorMessage}</div>
  {/if}
  {#each Array(TOTAL_PLAYER_SLOTS) as _, idx}
    <video
      bind:this={videos[idx]}
      class="player {idx === activeIndex ? 'active' : 'hidden'}"
      controls={idx === activeIndex}
    ></video>
  {/each}
</div>

<style>
  .video-container {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
  }
  .player {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transition: opacity 0.15s ease;
  }
  .active { opacity: 1; z-index: 2; pointer-events: auto; }
  .hidden { opacity: 0; z-index: 1; pointer-events: none; }
  .error-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.85);
    color: #ff4444;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    font-family: monospace;
  }
</style>