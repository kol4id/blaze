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
		message = 'Are you sure?',
		onconfirm,
		oncancel
	} = $props<{
		message?: string;
		onconfirm: () => void;
		oncancel: () => void;
	}>();

	onMount(async () => {
		await tick();
		const confirmBtn = document.querySelector('.btn-confirm') as HTMLButtonElement;
		if (confirmBtn) confirmBtn.focus();
	});

	function handleModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			oncancel();
		} else if (e.key === 'Enter') {
			e.preventDefault();
			onconfirm();
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
		<h3>Confirm</h3>

		<p class="message">{message}</p>

		<div class="modal-actions">
			<button class="btn btn-cancel" onclick={oncancel}>Cancel</button>
			<button class="btn btn-confirm" onclick={onconfirm}>Yes, Delete</button>
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
		max-width: 400px;
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

	.message {
		color: $text-primary;
		font-size: $fs-base;
		margin: 0;
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: $spacing-md;
		margin-top: $spacing-md;
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

	.btn-cancel {
		background: rgba(255, 255, 255, 0.1);
		color: $text-primary;

		&:hover {
			background: rgba(255, 255, 255, 0.2);
		}
	}

	.btn-confirm {
		background: rgba(#ef4444, 0.1);
		color: #ef4444;
		border: 1px solid rgba(#ef4444, 0.3);

		&:hover,
		&:focus-visible {
			background: #ef4444;
			color: white;
		}
	}
</style>
