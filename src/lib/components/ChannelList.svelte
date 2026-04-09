<script lang="ts">
	import type { Channel } from '$lib/types/channel';
	import { ChannelStatus } from '$lib/types/channel';
	import ChannelItem from './ChannelItem.svelte';

	let {
		channels = [],
		currentStreamUrl = '',
		isLoadingList = false,
		onselect,
		onhoverstart,
		onhoverend
	} = $props<{
		channels: Channel[];
		currentStreamUrl: string;
		isLoadingList: boolean;
		onselect: (index: number) => void;
		onhoverstart: (url: string, status: ChannelStatus) => void;
		onhoverend: () => void;
	}>();

	function handleKeydown(e: KeyboardEvent, index: number) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onselect(index);
		}
	}
</script>

<div class="channel-panel">
	<div class="panel-header">Channels ({channels.length})</div>
	{#if channels.length > 0}
		<ul class="channel-list">
			{#each channels as channel, i (channel.id)}
				<ChannelItem
					{channel}
					isActive={currentStreamUrl === channel.url}
					onclick={() => onselect(i)}
					onmouseenter={() => onhoverstart(channel.url, channel.status)}
					onmouseleave={onhoverend}
					onkeydown={(e) => handleKeydown(e, i)}
				/>
			{/each}
		</ul>
	{:else}
		<div class="empty-state">
			{isLoadingList ? 'Loading playlist...' : 'No channels loaded'}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$lib/styles/abstracts' as *;
	.channel-panel {
		width: $sidebar-width;
		@include glass;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		flex-shrink: 0;
	}

	.panel-header {
		padding: $spacing-md $spacing-md;
		background: $bg-glass-header;
		border-bottom: 1px solid $border-glass;
		font-size: $fs-xs;
		font-weight: $fw-semibold;
		text-transform: uppercase;
		letter-spacing: 1.5px;
		color: $text-secondary;
	}

	.channel-list {
		list-style: none;
		overflow-y: auto;
		flex-grow: 1;
		@include dark-scrollbar(6px);
	}

	.empty-state {
		@include flex-center;
		flex-grow: 1;
		color: $text-muted;
		font-size: $fs-sm;
		padding: $spacing-lg;
		text-align: center;
	}
</style>
