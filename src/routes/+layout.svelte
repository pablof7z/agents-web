<script lang="ts">
	import '$lib/ndk'; // Imports the NDK module which auto-connects on load
	import AuthHeader from '$lib/components/AuthHeader.svelte';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Agents Web</title>
</svelte:head>

<AuthHeader />
<div class="app-content">
	{@render children()}
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}

	:global(body) {
		margin: 0;
		font-family: system-ui, -apple-system, sans-serif;
		background: #fafafa;
		color: #1a1a1a;
	}

	.app-content {
		min-height: calc(100vh - 60px);
	}
</style>
