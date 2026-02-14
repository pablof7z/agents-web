<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import { USER_CONTEXT_KEY, type UserContext } from './user.context.js';
	import { cn } from '../../utils/cn.js';

	interface Props {
		class?: string;
		fallback?: string;
		alt?: string;
		customFallback?: Snippet;
	}

	let { class: className, fallback, alt = 'User avatar', customFallback }: Props = $props();

	const contextRef = getContext<{ value: UserContext }>(USER_CONTEXT_KEY);
	if (!contextRef) {
		throw new Error('User.Avatar must be used within a User.Root component');
	}
	const context = $derived(contextRef.value);

	let imageLoaded = $state(false);
	let imageError = $state(false);

	const imageUrl = $derived(context.profile?.picture ?? fallback);
	const pubkey = $derived(context.ndkUser?.pubkey ?? '');

	// Reset loading state when image URL changes
	$effect(() => {
		if (imageUrl) {
			imageLoaded = false;
			imageError = false;
		}
	});

	// Generate deterministic background gradient from pubkey
	const gradientColors = $derived.by(() => {
		if (!pubkey) return ['#6366f1', '#8b5cf6'];
		const hash = pubkey.slice(0, 8);
		const hue1 = parseInt(hash.slice(0, 4), 16) % 360;
		const hue2 = (hue1 + 40) % 360;
		return [`hsl(${hue1}, 70%, 60%)`, `hsl(${hue2}, 70%, 50%)`];
	});

	const initials = $derived(pubkey ? pubkey.slice(0, 2).toUpperCase() : '??');
</script>

<div
	class={cn(
		'relative overflow-hidden rounded-full bg-gradient-to-br flex items-center justify-center w-8 h-8',
		className
	)}
	style="background: linear-gradient(135deg, {gradientColors[0]}, {gradientColors[1]})"
	data-user-avatar
>
	<!-- Fallback layer -->
	{#if !imageLoaded || imageError}
		{#if customFallback}
			{@render customFallback()}
		{:else}
			<span class="text-white font-medium text-sm">{initials}</span>
		{/if}
	{/if}

	<!-- Image layer -->
	{#if imageUrl && !imageError}
		<img
			src={imageUrl}
			{alt}
			class={cn(
				'absolute inset-0 w-full h-full object-cover transition-opacity duration-200',
				imageLoaded ? 'opacity-100' : 'opacity-0'
			)}
			onload={() => (imageLoaded = true)}
			onerror={() => (imageError = true)}
		/>
	{/if}
</div>
