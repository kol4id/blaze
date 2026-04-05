<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    channelsStore, 
    currentStreamUrlStore, 
    currentIndexStore, 
    isLoadingPlaylistStore,
    loadPlaylist,
    playChannelByIndex,
    playChannel,
    setHoveredUrl,
    getPreloadUrls
  } from '$lib/stores/channelStore';
  import type { Channel } from '$lib/types/channel';
  import { ChannelStatus } from '$lib/types/channel';
  import SeamlessPlayer from '$lib/components/SeamlessPlayer.svelte';
  import { HOVER_PRELOAD_DELAY_MS } from '$lib/utils/constants';

  // Реактивные состояния (Svelte 5)
  let channels = $state<Channel[]>([]);
  let currentStreamUrl = $state('');
  let currentIndex = $state(-1);
  let isLoadingList = $state(false);
  let inputUrl = $state('');
  let hoverTimer: number | undefined;

  // Подписки на store (без реактивности, просто синхронизация)
  const unsubscribeChannels = channelsStore.subscribe(val => { channels = val; });
  const unsubscribeCurrentUrl = currentStreamUrlStore.subscribe(val => { currentStreamUrl = val; });
  const unsubscribeCurrentIndex = currentIndexStore.subscribe(val => { currentIndex = val; });
  const unsubscribeLoading = isLoadingPlaylistStore.subscribe(val => { isLoadingList = val; });

  // Вычисляемое значение: список предзагрузки
  let preloadUrls = $derived(getPreloadUrls());

  function findNextAvailableChannel(startIndex: number, direction: 'up' | 'down'): number {
    const step = direction === 'up' ? -1 : 1;
    let newIndex = startIndex + step;
    while (newIndex >= 0 && newIndex < channels.length) {
      if (channels[newIndex].status === ChannelStatus.Online) return newIndex;
      newIndex += step;
    }
    return -1;
  }

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (currentIndex === -1) {
        const firstOnline = channels.findIndex(c => c.status === ChannelStatus.Online);
        if (firstOnline !== -1) playChannelByIndex(firstOnline);
        return;
      }
      const nextIdx = findNextAvailableChannel(currentIndex, 'up');
      if (nextIdx !== -1) playChannelByIndex(nextIdx);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (currentIndex === -1) {
        const firstOnline = channels.findIndex(c => c.status === ChannelStatus.Online);
        if (firstOnline !== -1) playChannelByIndex(firstOnline);
        return;
      }
      const nextIdx = findNextAvailableChannel(currentIndex, 'down');
      if (nextIdx !== -1) playChannelByIndex(nextIdx);
    }
  }

  async function onLoadPlaylist(): Promise<void> {
    if (!inputUrl) return;
    try {
      await loadPlaylist(inputUrl);
    } catch (err) {
      alert(`Failed to load playlist: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  function handleMouseEnter(url: string, status: ChannelStatus): void {
    if (status !== ChannelStatus.Online) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      setHoveredUrl(url);
    }, HOVER_PRELOAD_DELAY_MS) as unknown as number;
  }

  function handleMouseLeave(): void {
    clearTimeout(hoverTimer);
    setHoveredUrl(null);
  }

  function handleChannelKeydown(event: KeyboardEvent, channel: Channel): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      playChannel(channel);
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    unsubscribeChannels();
    unsubscribeCurrentUrl();
    unsubscribeCurrentIndex();
    unsubscribeLoading();
    clearTimeout(hoverTimer);
  });
</script>

<main>
  <header>
    <h1>IPTV Pro: 5+5 Preload, Skip Offline</h1>
    <div class="controls">
      <input 
        type="text" 
        bind:value={inputUrl} 
        placeholder="Link to .m3u playlist" 
        onkeydown={(e) => e.key === 'Enter' && onLoadPlaylist()}
      />
      <button onclick={onLoadPlaylist} disabled={isLoadingList}>
        {isLoadingList ? 'Loading...' : 'Load Playlist'}
      </button>
    </div>
  </header>

  <div class="layout">
    <div class="playlist">
      <h2>Channels ({channels.length})</h2>
      {#if channels.length > 0}
        <ul>
          {#each channels as channel (channel.id)}
            <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
            <li
              class:active={currentStreamUrl === channel.url}
              class:offline={channel.status === ChannelStatus.Offline}
              role="button"
              tabindex="0"
              onmouseenter={() => handleMouseEnter(channel.url, channel.status)}
              onmouseleave={handleMouseLeave}
              onclick={() => playChannel(channel)}
              onkeydown={(e) => handleChannelKeydown(e, channel)}
            >
              <div class="channel-info">
                <span>{channel.name}</span>
                {#if channel.status === ChannelStatus.Checking}
                  <span class="status checking">⏳</span>
                {:else if channel.status === ChannelStatus.Online}
                  <span class="status online">🟢</span>
                {:else if channel.status === ChannelStatus.Offline}
                  <span class="status offline-icon">🔴</span>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty-text">{isLoadingList ? 'Loading playlist...' : 'No channels loaded'}</p>
      {/if}
    </div>

    <div class="player-wrapper">
      {#if currentStreamUrl}
        <SeamlessPlayer currentSrc={currentStreamUrl} preloadSrcs={preloadUrls} />
        <div class="debug-panel">
          <p>▶️ Current: <b>{currentStreamUrl.split('/').pop()}</b></p>
          <p>⏱️ Preloaded: {preloadUrls.length} / 10</p>
        </div>
      {:else}
        <div class="placeholder">Select a channel to start playback</div>
      {/if}
    </div>
  </div>
</main>

<style>
  :global(body) {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #121212;
    color: #e0e0e0;
    margin: 0;
    padding: 20px;
  }
  header {
    background: #1e1e1e;
    padding: 20px;
    border-radius: 12px;
    margin-bottom: 20px;
  }
  .controls {
    display: flex;
    gap: 10px;
    margin-top: 10px;
  }
  input {
    flex-grow: 1;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #333;
    background: #2a2a2a;
    color: #fff;
  }
  button {
    padding: 12px 24px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.2s;
  }
  button:hover:not(:disabled) {
    background: #0056b3;
  }
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .layout {
    display: flex;
    gap: 20px;
    height: 75vh;
  }
  .playlist {
    width: 350px;
    background: #1e1e1e;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .playlist h2 {
    padding: 15px;
    margin: 0;
    background: #252525;
    font-size: 16px;
    border-bottom: 1px solid #333;
  }
  .playlist ul {
    list-style: none;
    padding: 0;
    margin: 0;
    overflow-y: auto;
    flex-grow: 1;
  }
  .playlist li {
    padding: 12px 15px;
    border-bottom: 1px solid #2a2a2a;
    cursor: pointer;
    transition: all 0.2s;
    outline: none;
  }
  .playlist li:focus-visible {
    background: #2a6eb3;
    outline: 2px solid #007bff;
    outline-offset: -2px;
  }
  .playlist li:hover:not(.offline) {
    background: #2a2a2a;
    padding-left: 20px;
  }
  .playlist li.active {
    background: #007bff;
    color: white;
    border-bottom-color: transparent;
  }
  .playlist li.offline {
    opacity: 0.35;
    pointer-events: none;
    filter: grayscale(100%);
  }
  .channel-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .status {
    font-size: 12px;
  }
  .checking {
    animation: pulse 1s infinite alternate;
  }
  @keyframes pulse {
    from { opacity: 0.5; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1.1); }
  }
  .player-wrapper {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #1e1e1e;
    height: 100%;
    border-radius: 12px;
    color: #666;
    font-size: 18px;
  }
  .debug-panel {
    margin-top: 15px;
    padding: 15px;
    background: #1e1e1e;
    border-radius: 8px;
    font-size: 13px;
    font-family: monospace;
  }
</style>