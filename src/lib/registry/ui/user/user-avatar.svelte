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
		'avatar-root',
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
			<span class="avatar-fallback">{initials}</span>
		{/if}
	{/if}

	<!-- Image layer -->
	{#if imageUrl && !imageError}
		<img
			src={imageUrl}
			{alt}
			class={cn(
				'avatar-image',
				imageLoaded ? 'avatar-image-loaded' : 'avatar-image-hidden'
			)}
			onload={() => (imageLoaded = true)}
			onerror={() => (imageError = true)}
		/>
	{/if}
</div>

<style>
	.avatar-root {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		border-radius: 9999px;
		width: 2rem;
		height: 2rem;
		min-width: 2rem;
		min-height: 2rem;
		max-width: 100%;
		max-height: 100%;
		flex: 0 0 auto;
	}

	.avatar-fallback {
		color: white;
		font-weight: 500;
		font-size: 0.875rem;
		line-height: 1;
	}

	.avatar-image {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		transition: opacity 200ms ease;
	}

	.avatar-image-loaded {
		opacity: 1;
	}

	.avatar-image-hidden {
		opacity: 0;
	}
</style>
