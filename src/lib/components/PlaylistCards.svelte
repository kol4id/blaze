<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getAllSavedPlaylistsLocally, updatePlaylistNameLocally } from '../services/storageService';
	import type { SavedPlaylist } from '../services/storageService';

	let { onselect } = $props<{
		onselect: (url: string) => void;
	}>();

	let savedPlaylists = $state<SavedPlaylist[]>([]);
	let isLoading = $state(true);
	
	let editingUrl = $state<string | null>(null);
	let editName = $state('');

	onMount(async () => {
		await loadPlaylists();
	});
	
	async function loadPlaylists() {
		try {
			savedPlaylists = await getAllSavedPlaylistsLocally();
		} catch (e) {
			console.error('Failed to load saved playlists', e);
		} finally {
			isLoading = false;
		}
	}

	function formatLabel(url: string) {
		try {
			const u = new URL(url);
			const parts = u.pathname.split('/').filter(Boolean);
			const last = parts.pop() || u.hostname;
			return last.length > 30 ? last.substring(0, 27) + '...' : last;
		} catch {
			return url.length > 30 ? url.substring(0, 27) + '...' : url;
		}
	}

	function handleKeydown(e: KeyboardEvent, url: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			onselect(url);
		}
	}

	function focusHeaderInput() {
		const input = document.querySelector('.url-input') as HTMLInputElement;
		if (input) {
			input.focus();
		}
	}
	
	async function startEditing(playlist: SavedPlaylist) {
		editingUrl = playlist.url;
		editName = playlist.name || formatLabel(playlist.url);
		await tick();
		const activeInput = document.querySelector('.edit-input') as HTMLInputElement;
		if (activeInput) activeInput.focus();
	}
	
	async function saveEditing(url: string) {
		if (editingUrl) {
			await updatePlaylistNameLocally(url, editName.trim());
			editingUrl = null;
			await loadPlaylists();
		}
	}
	
	function handleEditKeydown(e: KeyboardEvent, url: string) {
		if (e.key === 'Enter') {
			e.preventDefault();
			saveEditing(url);
		} else if (e.key === 'Escape') {
			editingUrl = null;
		}
	}
</script>

<div class="playlist-cards-container">
	{#if isLoading}
		<div class="loading">Loading saved playlists...</div>
	{:else}
		<h2 class="title">Saved Playlists</h2>
		<div class="cards-grid">
			{#each savedPlaylists as playlist (playlist.url)}
				<div class="card-wrapper">
					{#if editingUrl === playlist.url}
						<div class="card edit-mode">
							<input
								type="text"
								class="edit-input"
								bind:value={editName}
								onkeydown={(e) => handleEditKeydown(e, playlist.url)}
								onblur={() => saveEditing(playlist.url)}
							/>
							<button class="save-btn" onclick={() => saveEditing(playlist.url)}>💾</button>
						</div>
					{:else}
						<button
							class="card"
							onclick={() => onselect(playlist.url)}
							onkeydown={(e) => handleKeydown(e, playlist.url)}
						>
							<div class="card-icon">📺</div>
							<div class="card-content">
								<span class="card-title">{playlist.name || formatLabel(playlist.url)}</span>
								<span class="card-meta">{playlist.channels.length} channels</span>
							</div>
						</button>
						<button
							class="edit-btn"
							onclick={(e) => { e.stopPropagation(); startEditing(playlist); }}
							aria-label="Edit playlist name"
						>
							✏️
						</button>
					{/if}
				</div>
			{/each}

			<div class="card-wrapper">
				<button
					class="card new-card"
					onclick={focusHeaderInput}
				>
					<div class="card-icon">+</div>
					<div class="card-content">
						<span class="card-title">Add New</span>
						<span class="card-meta">Enter URL above</span>
					</div>
				</button>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	@use "$lib/styles/abstracts" as *;

	.playlist-cards-container {
		flex-grow: 1;
		display: flex;
		flex-direction: column;
		padding: $spacing-xl;
		@include glass;
		overflow-y: auto;
		@include dark-scrollbar(8px);
	}

	.title {
		font-size: $fs-xl;
		font-weight: $fw-bold;
		@include gradient-text;
		margin-bottom: $spacing-xl;
		text-align: center;
	}

	.loading {
		@include flex-center;
		flex-grow: 1;
		color: $text-muted;
		font-size: $fs-lg;
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: $spacing-lg;
		padding: $spacing-md;
	}

	.card-wrapper {
		position: relative;
		display: flex;
	}

	.card {
		background: $bg-glass;
		border: 1px solid $border-glass;
		border-radius: $radius-lg;
		padding: $spacing-xl;
		display: flex;
		align-items: center;
		gap: $spacing-md;
		cursor: pointer;
		transition: all $transition-base;
		text-align: left;
		width: 100%;

		&:hover {
			background: $bg-glass-hover;
			transform: translateY(-4px);
			border-color: rgba(255, 255, 255, 0.2);
			box-shadow: $glow-ambient;
		}

		&:focus-visible {
			outline: none;
			border-color: $accent-cyan;
			box-shadow: 0 0 0 4px rgba($accent-cyan, 0.2), $glow-ambient;
			transform: translateY(-4px);
		}
	}

	.edit-btn {
		position: absolute;
		top: 10px;
		right: 10px;
		background: rgba(0, 0, 0, 0.5);
		border: 1px solid $border-glass;
		border-radius: $radius-sm;
		padding: 6px;
		cursor: pointer;
		color: $text-primary;
		transition: all $transition-base;
		z-index: 2;

		&:hover, &:focus-visible {
			background: rgba($accent-cyan, 0.2);
			border-color: $accent-cyan;
			transform: scale(1.1);
			outline: none;
		}
	}

	.edit-mode {
		flex-direction: row;
		padding: $spacing-md;
		gap: $spacing-sm;

		&:hover {
			transform: none;
			box-shadow: none;
		}
	}

	.edit-input {
		flex-grow: 1;
		padding: $spacing-sm;
		background: rgba(0, 0, 0, 0.3);
		border: 1px solid $accent-cyan;
		border-radius: $radius-sm;
		color: $text-primary;
		font-family: inherit;

		&:focus {
			outline: none;
			box-shadow: 0 0 0 2px rgba($accent-cyan, 0.3);
		}
	}

	.save-btn {
		padding: $spacing-sm;
		background: transparent;
		border: none;
		cursor: pointer;
		border-radius: $radius-sm;

		&:hover, &:focus-visible {
			background: rgba(255, 255, 255, 0.1);
			outline: 2px solid $accent-cyan;
		}
	}

	.card-icon {
		font-size: 32px;
		flex-shrink: 0;
		@include flex-center;
		width: 60px;
		height: 60px;
		background: rgba($accent-cyan, 0.1);
		border-radius: $radius-md;
		color: $accent-cyan;
	}

	.card-content {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
		overflow: hidden;
		flex-grow: 1;
	}

	.card-title {
		font-size: $fs-lg;
		font-weight: $fw-semibold;
		color: $text-primary;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.card-meta {
		font-size: $fs-sm;
		color: $text-secondary;
	}

	.new-card {
		background: transparent;
		border: 2px dashed $border-glass;

		&:hover, &:focus-visible {
			background: rgba(255,255,255,0.02);
			border-color: $accent-violet;
			.card-icon {
				color: $accent-violet;
				background: rgba($accent-violet, 0.1);
			}
		}

		.card-icon {
			color: $text-muted;
			background: rgba(255,255,255,0.05);
		}
	}
</style>
