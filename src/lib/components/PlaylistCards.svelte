<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { getAllSavedPlaylistsLocally, updatePlaylistDataLocally, deletePlaylistLocally } from '../services/storageService';
	import type { SavedPlaylist } from '../services/storageService';

	let { onselect } = $props<{
		onselect: (url: string) => void;
	}>();

	let savedPlaylists = $state<SavedPlaylist[]>([]);
	let isLoading = $state(true);
	
	let editingPlaylist = $state<SavedPlaylist | null>(null);
	let editName = $state('');
	let editUrl = $state('');

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
	
	async function openSettings(playlist: SavedPlaylist) {
		editingPlaylist = playlist;
		editName = playlist.name || formatLabel(playlist.url);
		editUrl = playlist.url;
		await tick();
		const nameInput = document.querySelector('.modal-input') as HTMLInputElement;
		if (nameInput) nameInput.focus();
	}

	function closeSettings() {
		editingPlaylist = null;
	}
	
	async function saveSettings() {
		if (editingPlaylist && editUrl.trim()) {
			await updatePlaylistDataLocally(editingPlaylist.url, editUrl.trim(), editName.trim());
			editingPlaylist = null;
			await loadPlaylists();
			window.dispatchEvent(new CustomEvent('playlists-updated'));
		}
	}

	async function handleDelete() {
		if (editingPlaylist && confirm('Are you sure you want to delete this playlist?')) {
			await deletePlaylistLocally(editingPlaylist.url);
			editingPlaylist = null;
			await loadPlaylists();
			window.dispatchEvent(new CustomEvent('playlists-updated'));
		}
	}

	function handleModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeSettings();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			saveSettings();
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
						class="settings-btn"
						onclick={(e) => { e.stopPropagation(); openSettings(playlist); }}
						aria-label="Playlist settings"
					>
						⚙️
					</button>
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

	{#if editingPlaylist}
		<div class="modal-overlay" onclick={closeSettings} onkeydown={handleModalKeydown} role="presentation">
			<div class="modal-content" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
				<h3>Playlist Settings</h3>
				
				<div class="form-group">
					<label for="editName">Playlist Name</label>
					<input id="editName" type="text" class="modal-input" bind:value={editName} />
				</div>

				<div class="form-group">
					<label for="editUrl">M3U URL</label>
					<input id="editUrl" type="text" class="modal-input" bind:value={editUrl} />
				</div>

				<div class="modal-actions">
					<button class="btn btn-delete" onclick={handleDelete}>🗑️ Delete</button>
					<div class="spacer"></div>
					<button class="btn btn-cancel" onclick={closeSettings}>Cancel</button>
					<button class="btn btn-save" onclick={saveSettings}>Save</button>
				</div>
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

	.settings-btn {
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

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		@include flex-center;
		z-index: 100;
	}

	.modal-content {
		background: $bg-glass;
		border: 1px solid $border-glass;
		border-radius: $radius-lg;
		padding: $spacing-xl;
		width: 90%;
		max-width: 500px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;

		h3 {
			margin: 0;
			color: $text-primary;
			font-size: $fs-xl;
			@include gradient-text;
		}
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;

		label {
			font-size: $fs-sm;
			color: $text-secondary;
		}
	}

	.modal-input {
		padding: $spacing-sm $spacing-md;
		background: $bg-input;
		border: 1px solid $border-input;
		border-radius: $radius-sm;
		color: $text-primary;
		font-family: inherit;
		font-size: $fs-base;

		&:focus {
			outline: none;
			border-color: $accent-cyan;
			box-shadow: 0 0 0 2px rgba($accent-cyan, 0.2);
		}
	}

	.modal-actions {
		display: flex;
		gap: $spacing-sm;
		margin-top: $spacing-md;

		.spacer {
			flex-grow: 1;
		}
	}

	.btn {
		padding: $spacing-sm $spacing-md;
		border-radius: $radius-sm;
		cursor: pointer;
		font-weight: $fw-medium;
		transition: all $transition-base;
		border: none;

		&:focus-visible {
			outline: 2px solid $accent-cyan;
			outline-offset: 2px;
		}
	}

	.btn-delete {
		background: rgba(#ef4444, 0.1);
		color: #ef4444;
		border: 1px solid rgba(#ef4444, 0.3);

		&:hover {
			background: #ef4444;
			color: white;
		}
	}

	.btn-cancel {
		background: rgba(255, 255, 255, 0.1);
		color: $text-primary;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.btn-save {
		background: $gradient-cta;
		color: white;

		&:hover {
			box-shadow: $glow-accent;
			transform: translateY(-1px);
		}
	}
</style>
