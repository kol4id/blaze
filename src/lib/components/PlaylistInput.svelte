<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getAllSavedPlaylistsLocally,
		updatePlaylistDataLocally,
		deletePlaylistLocally,
		togglePlaylistFavoriteLocally
	} from '../services/storageService';
	import type { SavedPlaylist } from '../services/storageService';
	import PlaylistModal from './PlaylistModal.svelte';
	import ConfirmModal from './ConfirmModal.svelte';
	import { formatLabel } from '$lib/utils/formatters';

	let { isLoading = false, onsubmit } = $props<{
		isLoading?: boolean;
		onsubmit: (url: string, name?: string) => void;
	}>();

	let inputUrl = $state('');
	let inputName = $state('');
	let showModal = $state(false);
	let isDropdownOpen = $state(false);
	let dropdownRef = $state<HTMLDivElement | null>(null);

	let savedPlaylists = $state<SavedPlaylist[]>([]);

	let editingPlaylist = $state<SavedPlaylist | null>(null);
	let editName = $state('');
	let editUrl = $state('');
	let deletingPlaylist = $state<SavedPlaylist | null>(null);

	async function loadSavedUrls() {
		try {
			savedPlaylists = await getAllSavedPlaylistsLocally();
		} catch (e) {
			console.error('Failed to load saved playlists', e);
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (dropdownRef && !dropdownRef.contains(e.target as Node)) {
			isDropdownOpen = false;
		}
	}

	onMount(() => {
		loadSavedUrls();
		const handleUpdate = () => loadSavedUrls();
		window.addEventListener('playlists-updated', handleUpdate);
		window.addEventListener('click', handleClickOutside);
		return () => {
			window.removeEventListener('playlists-updated', handleUpdate);
			window.removeEventListener('click', handleClickOutside);
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

	function handleSelectPlaylist(url: string) {
		inputUrl = url;
		isDropdownOpen = false;
		handleSubmit();
	}

	async function toggleFavorite(e: Event, url: string) {
		e.stopPropagation();
		await togglePlaylistFavoriteLocally(url);
		await loadSavedUrls();
		window.dispatchEvent(new CustomEvent('playlists-updated'));
	}

	async function openEdit(e: Event, playlist: SavedPlaylist) {
		e.stopPropagation();
		editingPlaylist = playlist;
		editName = playlist.name || formatLabel(playlist.url);
		editUrl = playlist.url;
		isDropdownOpen = false;
	}

	async function saveEditSettings(newName: string, newUrl: string) {
		if (editingPlaylist && newUrl.trim()) {
			await updatePlaylistDataLocally(editingPlaylist.url, newUrl.trim(), newName.trim());
			editingPlaylist = null;
			await loadSavedUrls();
			window.dispatchEvent(new CustomEvent('playlists-updated'));
		}
	}

	function promptDelete(e: Event, playlist: SavedPlaylist) {
		e.stopPropagation();
		deletingPlaylist = playlist;
		isDropdownOpen = false;
	}

	async function confirmDelete() {
		if (deletingPlaylist) {
			await deletePlaylistLocally(deletingPlaylist.url);
			deletingPlaylist = null;
			await loadSavedUrls();
			window.dispatchEvent(new CustomEvent('playlists-updated'));
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	}
</script>

<div class="input-group">
	{#if savedPlaylists.length > 0}
		<div class="dropdown-container" bind:this={dropdownRef}>
			<button
				class="url-input saved-select"
				onclick={(e) => {
					e.stopPropagation();
					isDropdownOpen = !isDropdownOpen;
				}}
			>
				Saved Playlists ▾
			</button>
			{#if isDropdownOpen}
				<ul class="dropdown-list">
					{#each savedPlaylists as playlist (playlist.url)}
						<li
							class="dropdown-item"
							onclick={() => handleSelectPlaylist(playlist.url)}
							role="option"
							aria-selected="false"
							tabindex="0"
							onkeydown={(e) => e.key === 'Enter' && handleSelectPlaylist(playlist.url)}
						>
							<span class="playlist-name">{playlist.name || formatLabel(playlist.url)}</span>
							<div class="playlist-actions">
								<button
									class="action-btn"
									onclick={(e) => openEdit(e, playlist)}
									title="Rename"
									aria-label="Rename">✏️</button
								>
								<button
									class="action-btn {playlist.isFavorite ? 'favorite' : ''}"
									onclick={(e) => toggleFavorite(e, playlist.url)}
									title="Favorite"
									aria-label="Favorite"
								>
									{playlist.isFavorite ? '★' : '☆'}
								</button>
								<button
									class="action-btn delete"
									onclick={(e) => promptDelete(e, playlist)}
									title="Delete"
									aria-label="Delete">🗑️</button
								>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
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
		{#each savedPlaylists as saved (saved.url)}
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

{#if editingPlaylist}
	<PlaylistModal
		initialName={editName}
		initialUrl={editUrl}
		onsave={saveEditSettings}
		oncancel={() => (editingPlaylist = null)}
		ondelete={() => promptDelete(new Event('click'), editingPlaylist!)}
	/>
{/if}

{#if deletingPlaylist}
	<ConfirmModal
		message="Are you sure you want to delete '{deletingPlaylist.name ||
			formatLabel(deletingPlaylist.url)}'?"
		onconfirm={confirmDelete}
		oncancel={() => (deletingPlaylist = null)}
	/>
{/if}

<style lang="scss">
	@use '$lib/styles/abstracts' as *;
	.input-group {
		display: flex;
		gap: $spacing-sm;
	}

	.dropdown-container {
		position: relative;
		flex-shrink: 0;
	}

	.saved-select {
		flex-grow: 0;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: space-between;
		white-space: nowrap;
		min-width: 150px;
	}

	.dropdown-list {
		position: absolute;
		top: calc(100% + $spacing-sm);
		left: 0;
		width: max-content;
		min-width: 280px;
		max-height: 300px;
		overflow-y: auto;
		background: $bg-glass;
		border: 1px solid $border-glass;
		border-radius: $radius-md;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10px);
		z-index: 50;
		list-style: none;
		margin: 0;
		padding: $spacing-xs;
		@include dark-scrollbar(6px);
	}

	.dropdown-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: $spacing-sm $spacing-md;
		border-radius: $radius-sm;
		cursor: pointer;
		transition: background $transition-base;
		color: $text-primary;
		gap: $spacing-md;

		&:hover,
		&:focus-visible {
			background: rgba(255, 255, 255, 0.1);
			outline: none;
		}
	}

	.playlist-name {
		flex-grow: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: $fs-sm;
	}

	.playlist-actions {
		display: flex;
		gap: $spacing-xs;
		opacity: 0;
		transition: opacity $transition-base;

		.dropdown-item:hover &,
		.dropdown-item:focus-within & {
			opacity: 1;
		}
	}

	.action-btn {
		background: none;
		border: none;
		padding: 4px;
		border-radius: $radius-sm;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all $transition-base;
		font-size: 14px;
		color: $text-secondary;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
			transform: scale(1.1);
		}

		&.favorite {
			color: #eab308; // yellow-500
		}

		&.delete:hover {
			background: rgba(#ef4444, 0.2);
		}
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
