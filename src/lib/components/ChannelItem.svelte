<script lang="ts">
	import type { Channel } from '$lib/types/channel';
	import { ChannelStatus } from '$lib/types/channel';

	let {
		channel,
		isActive = false,
		onclick,
		onmouseenter,
		onmouseleave,
		onkeydown
	} = $props<{
		channel: Channel;
		isActive?: boolean;
		onclick?: () => void;
		onmouseenter?: () => void;
		onmouseleave?: () => void;
		onkeydown?: (e: KeyboardEvent) => void;
	}>();
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<li
	class="channel-item"
	class:active={isActive}
	class:offline={channel.status === ChannelStatus.Offline}
	role="button"
	tabindex="0"
	{onclick}
	{onmouseenter}
	{onmouseleave}
	{onkeydown}
>
	<div class="channel-info">
		<span class="channel-name">{channel.name}</span>
		<div class="status-indicator">
			{#if channel.status === ChannelStatus.Checking}
				<span class="status-dot checking"></span>
			{:else if channel.status === ChannelStatus.Online}
				<span class="status-dot online"></span>
			{:else if channel.status === ChannelStatus.Offline}
				<span class="status-dot offline-dot"></span>
			{/if}
		</div>
	</div>
</li>

<style lang="scss">
	@use '$lib/styles/abstracts' as *;
	.channel-item {
		padding: $spacing-sm $spacing-md;
		border-bottom: 1px solid rgba(255, 255, 255, 0.04);
		cursor: pointer;
		transition: all $transition-base;
		outline: none;
		border-left: 3px solid transparent;

		&:hover:not(.offline) {
			background: $bg-glass-hover;
			padding-left: calc(#{$spacing-md} + 4px);
		}

		&:focus-visible {
			background: rgba($accent-cyan, 0.15);
			outline: 2px solid $accent-cyan;
			outline-offset: -2px;
		}

		&.active {
			background: linear-gradient(135deg, rgba($accent-cyan, 0.15), rgba($accent-violet, 0.1));
			border-left-color: $accent-cyan;
			@include glow-accent;
		}

		&.offline {
			opacity: 0.3;
			pointer-events: none;
			filter: grayscale(100%);
		}
	}

	.channel-info {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.channel-name {
		font-weight: $fw-medium;
		@include text-ellipsis;
	}

	.status-indicator {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 16px;
		height: 16px;
	}

	.status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;

		&.online {
			background: $color-online;
			box-shadow: 0 0 8px rgba($color-online, 0.6);
		}
		&.offline-dot {
			background: $color-offline;
		}
		&.checking {
			background: $color-checking;
			animation: pulse-dot 1.5s ease-in-out infinite;
		}
	}

	@keyframes pulse-dot {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(0.9);
		}
		50% {
			opacity: 1;
			transform: scale(1.3);
		}
	}
</style>
