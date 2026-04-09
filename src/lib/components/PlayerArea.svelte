<script lang="ts">
	import SeamlessPlayer from './SeamlessPlayer.svelte';

	let { currentStreamUrl = '', preloadUrls = [] } = $props<{
		currentStreamUrl: string;
		preloadUrls: string[];
	}>();
</script>

<div class="player-wrapper">
	<div class="player-container">
		{#if currentStreamUrl}
			<SeamlessPlayer currentSrc={currentStreamUrl} preloadSrcs={preloadUrls} />
		{:else}
			<div class="placeholder">
				<span class="placeholder-icon">▶</span>
				<span>Select a channel to start playback</span>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$lib/styles/abstracts' as *;
	.player-wrapper {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
		min-width: 0;
	}

	.player-container {
		position: relative;
		box-shadow: $glow-ambient;
		border-radius: $radius-md;
		overflow: hidden;
		background: #000;
		flex-grow: 1;
		display: flex;
		flex-direction: column;
	}

	.placeholder {
		@include flex-center;
		@include glass($bg-glass-header, 0); // No border radius inside container
		flex-direction: column;
		gap: $spacing-md;
		flex-grow: 1;
		color: $text-muted;
		font-size: $fs-lg;
		border: none;

		.placeholder-icon {
			font-size: 48px;
			opacity: 0.3;
			animation: subtle-pulse 3s ease-in-out infinite;
		}
	}

	@keyframes subtle-pulse {
		0%,
		100% {
			opacity: 0.2;
			transform: scale(1);
		}
		50% {
			opacity: 0.4;
			transform: scale(1.05);
		}
	}
</style>
