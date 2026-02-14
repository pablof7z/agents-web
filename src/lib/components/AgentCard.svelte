<script lang="ts">
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { ndk } from '$lib/ndk';
	import { User } from '$lib/registry/ui/user';

	interface Props {
		event: NDKEvent;
		onclick?: () => void;
	}

	let { event, onclick }: Props = $props();

	// Extract agent details from tags
	const title = $derived(event.tagValue('title') ?? 'Untitled Agent');
	const role = $derived(event.tagValue('role') ?? 'No role defined');
	const description = $derived(event.tagValue('description') ?? '');
	const version = $derived(event.tagValue('ver') ?? '1.0');

	// Get author pubkey from the event
	const authorPubkey = $derived(event.pubkey);
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<article class="agent-card" role="button" tabindex="0" {onclick} onkeydown={(e) => e.key === 'Enter' && onclick?.()}>
	<header>
		<h2>{title}</h2>
		<span class="version">v{version}</span>
	</header>

	<p class="role">{role}</p>

	{#if description}
		<p class="description">{description}</p>
	{/if}

	<footer>
		<div class="author">
			<User.Root {ndk} pubkey={authorPubkey}>
				<User.Avatar class="w-6 h-6 text-[10px]" />
				<User.Name />
			</User.Root>
		</div>
		<time datetime={new Date(event.created_at! * 1000).toISOString()}>
			{new Date(event.created_at! * 1000).toLocaleDateString()}
		</time>
	</footer>
</article>

<style>
	.agent-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		border: 1px solid #e5e5e5;
	}

	.agent-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.agent-card:focus {
		outline: 2px solid #6366f1;
		outline-offset: 2px;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}

	h2 {
		margin: 0;
		font-size: 1.25rem;
		color: #1a1a1a;
	}

	.version {
		font-size: 0.75rem;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
		color: #6b7280;
	}

	.role {
		margin: 0 0 0.75rem 0;
		color: #6366f1;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.description {
		margin: 0 0 1rem 0;
		color: #4b5563;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	footer {
		border-top: 1px solid #f3f4f6;
		padding-top: 0.75rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.author {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.author :global([data-user-root]) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.author :global([data-user-name]) {
		font-size: 0.8rem;
		color: #4b5563;
		font-weight: 500;
	}

	time {
		font-size: 0.75rem;
		color: #9ca3af;
	}
</style>
