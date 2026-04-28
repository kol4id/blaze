<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllSavedPlaylistsLocally } from '../services/storageService';
	import PlaylistModal from './PlaylistModal.svelte';
	import { formatLabel } from '$lib/utils/formatters';

	let { isLoading = false, onsubmit } = $props<{
		isLoading?: boolean;
		onsubmit: (url: string, name?: string) => void;
	}>();

	let inputUrl = $state('');
	let inputName = $state('');
	let showModal = $state(false);
	let savedUrls = $state<{ url: string; timestamp: number }[]>([]);

	async function loadSavedUrls() {
		try {
			const playlists = await getAllSavedPlaylistsLocally();
			savedUrls = playlists.map((p) => ({ url: p.url, timestamp: p.timestamp }));
		} catch (e) {
			console.error('Failed to load saved playlists', e);
		}
	}

	onMount(() => {
		loadSavedUrls();
		const handleUpdate = () => loadSavedUrls();
		window.addEventListener('playlists-updated', handleUpdate);
		return () => {
			window.removeEventListener('playlists-updated', handleUpdate);
		};
	});

	function handleSubmit() {
		if (inputUrl.trim()) {
			showModal = true;
		}
	}

	function handleModalSave(name: string, url: string) {
		showModal = false;
		onsubmit(url.trim(), name.trim() || undefined);
		inputUrl = '';
		inputName = '';
		setTimeout(loadSavedUrls, 1000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

<div class="input-group">
	{#if savedUrls.length > 0}
		<select
			class="url-input saved-select"
			onchange={(e) => {
				const val = (e.currentTarget as HTMLSelectElement).value;
				if (val) {
					inputUrl = val;
					handleSubmit();
					(e.currentTarget as HTMLSelectElement).value = '';
				}
			}}
		>
			<option value="" disabled selected>Saved Playlists</option>
			{#each savedUrls as saved (saved.url)}
				<option value={saved.url}>{formatLabel(saved.url)}</option>
			{/each}
		</select>
	{/if}

	<input
		type="text"
		class="url-input"
		bind:value={inputUrl}
		placeholder="Link to .m3u playlist"
		onkeydown={handleKeydown}
		list="saved-playlists"
	/>
	<datalist id="saved-playlists">
		{#each savedUrls as saved (saved.url)}
			<option value={saved.url}></option>
		{/each}
	</datalist>
	<button class="load-btn" onclick={handleSubmit} disabled={isLoading}>
		{isLoading ? 'Loading...' : 'Load Playlist'}
	</button>
</div>

{#if showModal}
	<PlaylistModal
		isNew={true}
		initialName={inputName}
		initialUrl={inputUrl}
		onsave={handleModalSave}
		oncancel={() => (showModal = false)}
	/>
{/if}

<style lang="scss">
	@use '$lib/styles/abstracts' as *;
	.input-group {
		display: flex;
		gap: $spacing-sm;
	}

	.saved-select {
		flex-grow: 0;
		max-width: 200px;
		cursor: pointer;
	}

	.url-input {
		flex-grow: 1;
		padding: $spacing-sm $spacing-md;
		border-radius: $radius-sm;
		border: 1px solid $border-input;
		background: $bg-input;
		color: $text-primary;
		font-family: $font-sans;
		font-size: $fs-sm;
		transition:
			border-color $transition-base,
			box-shadow $transition-base;

		&::placeholder {
			color: $text-muted;
		}
		&:focus {
			outline: none;
			border-color: $accent-cyan;
			box-shadow: 0 0 0 3px rgba($accent-cyan, 0.15);
		}
	}

	.load-btn {
		padding: $spacing-sm $spacing-lg;
		background: $gradient-cta;
		color: $text-white;
		border: none;
		border-radius: $radius-sm;
		cursor: pointer;
		font-weight: $fw-semibold;
		font-size: $fs-base;
		transition:
			opacity $transition-base,
			transform $transition-base,
			box-shadow $transition-base;
		white-space: nowrap;

		&:hover:not(:disabled) {
			opacity: 0.9;
			transform: translateY(-1px);
			@include glow-accent;
		}
		&:active:not(:disabled) {
			transform: translateY(0);
		}
		&:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
</style>
