<script lang="ts">
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { goto } from '$app/navigation';
	import { ndk } from '$lib/ndk';
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
	const image = $derived(event.tagValue('image') ?? '');

	// Get author pubkey from the event
	const authorPubkey = $derived(event.pubkey);

	// Fetch the agent's kind:0 metadata event, which contains `a` tags
	// pointing to the project coordinates this agent belongs to
	const agentMetaSubscription = $derived(
		ndk.$subscribe(() => ({
			filters: [{ kinds: [0], authors: [event.pubkey] }]
		}))
	);

	// Read the `a` tags from the agent's kind:0 to discover which projects they belong to.
	// Each `a` tag value is a coordinate like "<kind>:<pubkey>:<d-tag>".
	// We use the <d-tag> portion as the project name for display.
	const projects = $derived.by(() => {
		const metaEvents = agentMetaSubscription?.events ?? [];
		if (metaEvents.length === 0) return [];
		const metaEvent: NDKEvent = metaEvents[0];
		return metaEvent.getMatchingTags('a').map((tag: string[]) => {
			const coord = tag[1] ?? '';
			// coord format: "<kind>:<pubkey>:<d-tag>"
			const parts = coord.split(':');
			return parts[2] ?? coord;
		}).filter(Boolean);
	});
</script>

{#if image}
	<!-- Portrait poster card — full-bleed image background with overlay -->
	<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
	<article
		class="agent-card portrait-card"
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={(e) => e.key === 'Enter' && handleClick()}
	>
		<img class="portrait-bg" src={image} alt={title} />
		<div class="portrait-overlay"></div>

		<div class="portrait-content">
			<div class="portrait-top">
				<span class="version-badge">v{version}</span>
			</div>

			<div class="portrait-bottom">
				<h2>{title}</h2>
				<p class="role">{role}</p>

				<div class="portrait-author">
					<User.Root {ndk} pubkey={authorPubkey}>
						<div class="avatar-wrapper">
							<User.Avatar />
						</div>
						<User.Name />
					</User.Root>
				</div>
			</div>
		</div>
	</article>
{:else}
	<!-- Standard card (no image) -->
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
{/if}

<style>
	/* ── Shared base ─────────────────────────────────────────── */
	.agent-card {
		border-radius: 12px;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		overflow: hidden;
	}

	.agent-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}

	.agent-card:focus {
		outline: 2px solid #6366f1;
		outline-offset: 2px;
	}

	/* ── Portrait poster card ────────────────────────────────── */
	.portrait-card {
		position: relative;
		aspect-ratio: 2 / 3;
		background: #111;
		display: flex;
		flex-direction: column;
	}

	.portrait-bg {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center top;
		display: block;
	}

	/* Gradient: transparent at top → deep dark at bottom */
	.portrait-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to bottom,
			rgba(0, 0, 0, 0.1) 0%,
			rgba(0, 0, 0, 0.15) 40%,
			rgba(0, 0, 0, 0.75) 70%,
			rgba(0, 0, 0, 0.95) 100%
		);
	}

	.portrait-content {
		position: relative;
		z-index: 1;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		height: 100%;
		padding: 1rem;
	}

	.portrait-top {
		display: flex;
		justify-content: flex-end;
	}

	.version-badge {
		font-size: 0.7rem;
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(4px);
		color: rgba(255, 255, 255, 0.9);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		border: 1px solid rgba(255, 255, 255, 0.2);
	}

	.portrait-bottom {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.portrait-card h2 {
		margin: 0;
		font-size: 1.3rem;
		font-weight: 700;
		color: #fff;
		line-height: 1.2;
		text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
	}

	.portrait-card .role {
		margin: 0 0 0.5rem 0;
		font-size: 0.8rem;
		color: rgba(255, 255, 255, 0.75);
		font-weight: 400;
		line-height: 1.3;
	}

	.portrait-author {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.portrait-author :global([data-user-root]) {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.portrait-author :global([data-user-name]) {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.8);
		font-weight: 500;
	}

	/* ── Standard card (no image) ────────────────────────────── */
	.agent-card:not(.portrait-card) {
		background: white;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
	}

	.agent-card:not(.portrait-card):hover {
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
