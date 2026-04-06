<script lang="ts">
	import PlaylistInput from './PlaylistInput.svelte';

	let { isLoading = false, onloadplaylist } = $props<{
		isLoading?: boolean;
		onloadplaylist: (url: string) => void;
	}>();
</script>

<header>
	<div class="logo">
		<span class="logo-icon">⚡</span>
		Blaze
	</div>
	<div class="input-area">
		<PlaylistInput {isLoading} onsubmit={onloadplaylist} />
	</div>
</header>

<style lang="scss">
	@use "$lib/styles/abstracts" as *;
	header {
		@include glass;
		padding: $spacing-lg;
		margin-bottom: $spacing-md;
		display: flex;
		align-items: center;
		gap: $spacing-lg;
	}

	.logo {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		font-size: $fs-xl;
		font-weight: $fw-bold;
		@include gradient-text;
		white-space: nowrap;
		user-select: none;
	}

	.logo-icon {
		font-size: 28px;
	}

	.input-area {
		flex-grow: 1;
	}
</style>
