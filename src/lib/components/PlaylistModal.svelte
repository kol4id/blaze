<script lang="ts">
	import { onMount, tick } from 'svelte';

	export function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentNode) {
					node.parentNode.removeChild(node);
				}
			}
		};
	}

	let {
		isNew = false,
		initialName = '',
		initialUrl = '',
		onsave,
		oncancel,
		ondelete
	} = $props<{
		isNew?: boolean;
		initialName?: string;
		initialUrl?: string;
		onsave: (name: string, url: string) => void;
		oncancel: () => void;
		ondelete?: () => void;
	}>();

	let editName = $state('');
	let editUrl = $state('');

	$effect(() => {
		editName = initialName;
		editUrl = initialUrl;
	});

	onMount(async () => {
		await tick();
		const nameInput = document.querySelector('.modal-input') as HTMLInputElement;
		if (nameInput) nameInput.focus();
	});

	function handleModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			oncancel();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			onsave(editName, editUrl);
		}
	}
</script>

<div
	class="modal-overlay"
	use:portal
	onclick={oncancel}
	onkeydown={handleModalKeydown}
	role="presentation"
>
	<div
		class="modal-content"
		onclick={(e) => e.stopPropagation()}
		onkeydown={(e) => e.stopPropagation()}
		role="dialog"
		aria-modal="true"
		tabindex="-1"
	>
		<h3>{isNew ? 'Add Playlist' : 'Playlist Settings'}</h3>

		<div class="form-group">
			<label for="editName">Playlist Name</label>
			<input
				id="editName"
				type="text"
				class="modal-input"
				bind:value={editName}
				placeholder="Optional"
			/>
		</div>

		<div class="form-group">
			<label for="editUrl">M3U URL</label>
			<input
				id="editUrl"
				type="text"
				class="modal-input"
				bind:value={editUrl}
				placeholder="https://..."
			/>
		</div>

		<div class="modal-actions">
			{#if !isNew && ondelete}
				<button class="btn btn-delete" onclick={ondelete}>🗑️ Delete</button>
			{/if}
			<div class="spacer"></div>
			<button class="btn btn-cancel" onclick={oncancel}>Cancel</button>
			<button class="btn btn-save" onclick={() => onsave(editName, editUrl)}>Save</button>
		</div>
	</div>
</div>

<style lang="scss">
	@use '$lib/styles/abstracts' as *;

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
