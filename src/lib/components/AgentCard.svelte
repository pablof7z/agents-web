<script lang="ts">
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { goto } from '$app/navigation';
	import { ndk, AGENT_DEFINITION_KIND } from '$lib/ndk';
	import { User } from '$lib/registry/ui/user';
	import { encodeNevent } from '$lib/utils/nostr';

	interface Props {
		event: NDKEvent;
		onclick?: () => void;
	}

	let { event, onclick }: Props = $props();

	// Navigate to the detail page for this agent
	function navigateToDetail() {
		const nevent = encodeNevent(event.id, undefined, event.pubkey, event.kind);
		goto(`/e/${nevent}`);
	}

	// Use provided onclick or default to navigation
	function handleClick() {
		if (onclick) {
			onclick();
		} else {
			navigateToDetail();
		}
	}

	// Extract agent details from tags
	const title = $derived(event.tagValue('title') ?? 'Untitled Agent');
	const role = $derived(event.tagValue('role') ?? 'No role defined');
	const description = $derived(event.tagValue('description') ?? '');
	const version = $derived(event.tagValue('ver') ?? '1.0');

	// Get author pubkey from the event
	const authorPubkey = $derived(event.pubkey);

	// Build the addressable coordinate for this agent's kind:4199 event
	// Format: "<kind>:<pubkey>:<d-tag>"
	const agentCoordinate = $derived(() => {
		const dTag = event.tagValue('d') ?? '';
		return `${AGENT_DEFINITION_KIND}:${event.pubkey}:${dTag}`;
	});

	// Subscribe to kind:0 metadata events that have an `a` tag referencing this agent
	// These represent projects the agent belongs to
	const projectsSubscription = $derived.by(() => {
		const coord = agentCoordinate();
		return ndk.$subscribe(() => ({
			filters: [{
				kinds: [0],
				'#a': [coord]
			}]
		}));
	});

	// Extract project names from the kind:0 metadata events
	const projects = $derived.by(() => {
		const events = projectsSubscription?.events ?? [];
		return events.map((e: NDKEvent) => {
			try {
				const profile = JSON.parse(e.content || '{}');
				return profile.name || profile.displayName || e.pubkey.slice(0, 8) + '...';
			} catch {
				return e.pubkey.slice(0, 8) + '...';
			}
		});
	});
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<article class="agent-card" role="button" tabindex="0" onclick={handleClick} onkeydown={(e) => e.key === 'Enter' && handleClick()}>
	<header>
		<h2>{title}</h2>
		<span class="version">v{version}</span>
	</header>

	<p class="role">{role}</p>

	{#if description}
		<p class="description">{description}</p>
	{/if}

	{#if projects.length > 0}
		<div class="projects">
			{#each projects as projectName}
				<span class="project-badge">{projectName}</span>
			{/each}
		</div>
	{/if}

	<footer>
		<div class="author">
			<User.Root {ndk} pubkey={authorPubkey}>
				<div class="avatar-wrapper">
					<User.Avatar />
				</div>
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

	.projects {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 0.75rem;
	}

	.project-badge {
		font-size: 0.75rem;
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #bbf7d0;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		font-weight: 500;
		white-space: nowrap;
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

	.avatar-wrapper {
		width: 24px;
		height: 24px;
		flex-shrink: 0;
	}

	.avatar-wrapper :global([data-user-avatar]) {
		width: 100%;
		height: 100%;
	}

	.avatar-wrapper :global([data-user-avatar] span) {
		font-size: 10px;
	}

	time {
		font-size: 0.75rem;
		color: #9ca3af;
	}
</style>
