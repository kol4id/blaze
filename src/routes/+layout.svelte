<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '$lib/styles/global.scss';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Blaze — IPTV Player</title>
	<meta name="description" content="Premium IPTV streaming player with smart preloading" />
</svelte:head>

{@render children()}
