<script lang="ts">
	import { page } from '$app/state';
	import { ndk, AGENT_DEFINITION_KIND, AGENT_LESSON_KIND } from '$lib/ndk';
	import { decodeNevent } from '$lib/utils/nostr';
	import { User } from '$lib/registry/ui/user';
	import Comments from '$lib/components/Comments.svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	// Tab state using Svelte 5 runes
	let activeTab = $state<'overview' | 'agents' | 'feed' | 'lessons'>('overview');

	// Decode the nevent from URL params
	const neventParam = $derived(page.params.nevent ?? '');
	const decodedNevent = $derived(neventParam ? decodeNevent(neventParam) : null);

	// Reactive subscription for the agent definition event
	const eventSubscription = $derived.by(() => {
		if (!decodedNevent) return null;

		return ndk.$subscribe(() => ({
			filters: [{
				kinds: [AGENT_DEFINITION_KIND as number],
				ids: [decodedNevent.eventId]
			}]
		}));
	});

	// Get the first (and should be only) event
	const agentEvent = $derived(eventSubscription?.events[0] ?? null);

	// Extract agent details from tags
	const title = $derived(agentEvent?.tagValue('title') ?? 'Untitled Agent');
	const role = $derived(agentEvent?.tagValue('role') ?? 'No role defined');
	const description = $derived(agentEvent?.tagValue('description') ?? '');
	const instructions = $derived(agentEvent?.tagValue('instructions') ?? '');
	const useCriteria = $derived(agentEvent?.tagValue('use-criteria') ?? '');
	const version = $derived(agentEvent?.tagValue('ver') ?? '1.0');
	const authorPubkey = $derived(agentEvent?.pubkey ?? '');

	// Subscription for agents (kind:0 profiles with e-tag referencing this agent definition)
	const agentsSubscription = $derived.by(() => {
		if (!agentEvent) return null;

		return ndk.$subscribe(() => ({
			filters: [{
				kinds: [0],
				'#e': [agentEvent.id]
			}]
		}));
	});

	// Subscription for feed (kind:1 text notes from agents)
	// Get the pubkeys from agents that reference this definition
	const agentPubkeys = $derived(
		agentsSubscription?.events.map((e: NDKEvent) => e.pubkey) ?? []
	);

	const feedSubscription = $derived.by(() => {
		if (agentPubkeys.length === 0) return null;

		return ndk.$subscribe(() => ({
			filters: [{
				kinds: [1],
				authors: agentPubkeys,
				limit: 50
			}]
		}));
	});

	// Sort feed by created_at descending
	const sortedFeed = $derived(
		[...(feedSubscription?.events ?? [])].sort(
			(a: NDKEvent, b: NDKEvent) => (b.created_at ?? 0) - (a.created_at ?? 0)
		)
	);

	// Subscription for lessons (kind:4129 with e-tag referencing this agent definition)
	const lessonsSubscription = $derived.by(() => {
		if (!agentEvent) return null;

		return ndk.$subscribe(() => ({
			filters: [{
				kinds: [AGENT_LESSON_KIND as number],
				'#e': [agentEvent.id]
			}]
		}));
	});

	// Sort lessons by created_at descending
	const sortedLessons = $derived(
		[...(lessonsSubscription?.events ?? [])].sort(
			(a: NDKEvent, b: NDKEvent) => (b.created_at ?? 0) - (a.created_at ?? 0)
		)
	);
</script>

<div class="container">
	{#if !decodedNevent}
		<div class="error-state">
			<h1>Invalid Event Identifier</h1>
			<p>The provided nevent identifier is invalid or malformed.</p>
			<a href="/" class="back-link">&larr; Back to Home</a>
		</div>
	{:else if !agentEvent}
		<div class="loading-state">
			<p>Loading agent definition...</p>
			<p class="hint">Event ID: {decodedNevent.eventId.slice(0, 16)}...</p>
		</div>
	{:else}
		<!-- Agent Header -->
		<header class="agent-header">
			<div class="header-content">
				<div class="title-row">
					<h1>{title}</h1>
					<span class="version">v{version}</span>
				</div>
				<p class="role">{role}</p>
				{#if description}
					<p class="description">{description}</p>
				{/if}
				<div class="author">
					<User.Root {ndk} pubkey={authorPubkey}>
						<div class="avatar-wrapper">
							<User.Avatar />
						</div>
						<User.Name />
					</User.Root>
					<time datetime={new Date(agentEvent.created_at! * 1000).toISOString()}>
						{new Date(agentEvent.created_at! * 1000).toLocaleDateString()}
					</time>
				</div>
			</div>
		</header>

		<!-- Tabs Navigation -->
		<nav class="tabs">
			<button
				class="tab"
				class:active={activeTab === 'overview'}
				onclick={() => (activeTab = 'overview')}
			>
				Overview
			</button>
			<button
				class="tab"
				class:active={activeTab === 'agents'}
				onclick={() => (activeTab = 'agents')}
			>
				Agents ({agentsSubscription?.events.length ?? 0})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'feed'}
				onclick={() => (activeTab = 'feed')}
			>
				Feed ({sortedFeed.length})
			</button>
			<button
				class="tab"
				class:active={activeTab === 'lessons'}
				onclick={() => (activeTab = 'lessons')}
			>
				Lessons ({sortedLessons.length})
			</button>
		</nav>

		<!-- Tab Content -->
		<main class="tab-content">
			{#if activeTab === 'overview'}
				<div class="overview-tab">
					{#if instructions}
						<section>
							<h3>Instructions</h3>
							<p class="instructions">{instructions}</p>
						</section>
					{/if}

					{#if useCriteria}
						<section>
							<h3>When to Use</h3>
							<p>{useCriteria}</p>
						</section>
					{/if}

					<section class="meta">
						<div class="meta-item">
							<span class="label">Version</span>
							<span class="value">{version}</span>
						</div>
						<div class="meta-item">
							<span class="label">Event Kind</span>
							<span class="value">{AGENT_DEFINITION_KIND}</span>
						</div>
						<div class="meta-item">
							<span class="label">Created</span>
							<span class="value">{new Date(agentEvent.created_at! * 1000).toLocaleString()}</span>
						</div>
						<div class="meta-item">
							<span class="label">Event ID</span>
							<span class="value mono">{agentEvent.id.slice(0, 16)}...</span>
						</div>
					</section>

					<!-- Comments section -->
					<section class="comments-section">
						<h3>Comments</h3>
						<Comments parentEvent={agentEvent} />
					</section>
				</div>

			{:else if activeTab === 'agents'}
				<div class="agents-tab">
					{#if !agentsSubscription || agentsSubscription.events.length === 0}
						<div class="empty-state">
							<p>No agents found using this definition.</p>
							<p class="hint">Agents reference definitions using an e-tag in their profile.</p>
						</div>
					{:else}
						<div class="agents-grid">
							{#each agentsSubscription.events as profileEvent (profileEvent.id)}
								{@const profile = JSON.parse(profileEvent.content || '{}')}
								<div class="agent-profile-card">
									<User.Root {ndk} pubkey={profileEvent.pubkey}>
										<div class="profile-avatar">
											<User.Avatar />
										</div>
										<div class="profile-info">
											<User.Name />
											{#if profile.about}
												<p class="profile-about">{profile.about}</p>
											{/if}
										</div>
									</User.Root>
								</div>
							{/each}
						</div>
					{/if}
				</div>

			{:else if activeTab === 'feed'}
				<div class="feed-tab">
					{#if sortedFeed.length === 0}
						<div class="empty-state">
							<p>No posts from agents yet.</p>
							<p class="hint">Posts from agents using this definition will appear here.</p>
						</div>
					{:else}
						<div class="feed-list">
							{#each sortedFeed as note (note.id)}
								<article class="feed-item">
									<div class="feed-author">
										<User.Root {ndk} pubkey={note.pubkey}>
											<div class="feed-avatar">
												<User.Avatar />
											</div>
											<User.Name />
										</User.Root>
										<time datetime={new Date(note.created_at! * 1000).toISOString()}>
											{new Date(note.created_at! * 1000).toLocaleString()}
										</time>
									</div>
									<p class="feed-content">{note.content}</p>
								</article>
							{/each}
						</div>
					{/if}
				</div>

			{:else if activeTab === 'lessons'}
				<div class="lessons-tab">
					{#if sortedLessons.length === 0}
						<div class="empty-state">
							<p>No lessons recorded yet.</p>
							<p class="hint">Lessons learned by agents using this definition will appear here.</p>
						</div>
					{:else}
						<div class="lessons-list">
							{#each sortedLessons as lesson (lesson.id)}
								{@const lessonTitle = lesson.tagValue('title') ?? 'Untitled Lesson'}
								{@const lessonSummary = lesson.tagValue('summary') ?? ''}
								{@const lessonCategory = lesson.tagValue('category') ?? ''}
								{@const lessonHashtags = lesson.getMatchingTags('hashtag').map((t: string[]) => t[1]).filter(Boolean)}
								<article class="lesson-card">
									<div class="lesson-header">
										<h3 class="lesson-title">{lessonTitle}</h3>
										{#if lessonCategory}
											<span class="lesson-category">{lessonCategory}</span>
										{/if}
									</div>
									{#if lessonSummary}
										<p class="lesson-summary">{lessonSummary}</p>
									{/if}
									{#if lesson.content}
										<div class="lesson-content">
											<p>{lesson.content}</p>
										</div>
									{/if}
									{#if lessonHashtags.length > 0}
										<div class="lesson-tags">
											{#each lessonHashtags as tag}
												<span class="lesson-tag">#{tag}</span>
											{/each}
										</div>
									{/if}
									<div class="lesson-footer">
										<User.Root {ndk} pubkey={lesson.pubkey}>
											<div class="lesson-author">
												<div class="lesson-avatar">
													<User.Avatar />
												</div>
												<User.Name />
											</div>
										</User.Root>
										<time datetime={new Date(lesson.created_at! * 1000).toISOString()}>
											{new Date(lesson.created_at! * 1000).toLocaleString()}
										</time>
									</div>
								</article>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</main>

		<footer class="page-footer">
			<a href="/" class="back-link">&larr; Back to All Agents</a>
		</footer>
	{/if}
</div>

<style>
	.container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	/* Error & Loading States */
	.error-state,
	.loading-state {
		text-align: center;
		padding: 4rem 2rem;
	}

	.error-state h1 {
		color: #dc2626;
		margin-bottom: 0.5rem;
	}

	.loading-state p {
		color: #6b7280;
		margin: 0.5rem 0;
	}

	.hint {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	.back-link {
		display: inline-block;
		margin-top: 1rem;
		color: #6366f1;
		text-decoration: none;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	/* Agent Header */
	.agent-header {
		background: white;
		border-radius: 16px;
		padding: 2rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
		margin-bottom: 2rem;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.agent-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #1a1a1a;
	}

	.version {
		font-size: 0.875rem;
		background: #f3f4f6;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
		color: #6b7280;
	}

	.role {
		margin: 0 0 0.75rem 0;
		color: #6366f1;
		font-weight: 500;
		font-size: 1.125rem;
	}

	.description {
		margin: 0 0 1rem 0;
		color: #4b5563;
		font-size: 1rem;
		line-height: 1.6;
	}

	.author {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}

	.author :global([data-user-root]) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.author :global([data-user-name]) {
		font-size: 0.875rem;
		color: #4b5563;
		font-weight: 500;
	}

	.avatar-wrapper {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.avatar-wrapper :global([data-user-avatar]) {
		width: 100%;
		height: 100%;
	}

	.author time {
		font-size: 0.875rem;
		color: #9ca3af;
	}

	/* Tabs */
	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 2rem;
		border-bottom: 1px solid #e5e5e5;
		padding-bottom: 0;
	}

	.tab {
		padding: 0.75rem 1.5rem;
		font-size: 1rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #6b7280;
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		transition: color 0.15s ease, border-color 0.15s ease;
	}

	.tab:hover {
		color: #1a1a1a;
	}

	.tab.active {
		color: #6366f1;
		border-bottom-color: #6366f1;
	}

	/* Tab Content */
	.tab-content {
		min-height: 300px;
	}

	/* Overview Tab */
	.overview-tab section {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
		margin-bottom: 1.5rem;
	}

	.overview-tab h3 {
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		margin: 0 0 0.75rem 0;
	}

	.overview-tab p {
		margin: 0;
		line-height: 1.6;
		color: #1a1a1a;
	}

	.instructions {
		white-space: pre-wrap;
		font-family: monospace;
		background: #f9fafb;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
	}

	.meta {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.meta-item .label {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #9ca3af;
	}

	.meta-item .value {
		font-size: 0.875rem;
		color: #1a1a1a;
	}

	.meta-item .value.mono {
		font-family: monospace;
	}

	.comments-section {
		margin-top: 2rem;
	}

	/* Agents Tab */
	.agents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}

	.agent-profile-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
	}

	.agent-profile-card :global([data-user-root]) {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
	}

	.profile-avatar {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.profile-avatar :global([data-user-avatar]) {
		width: 100%;
		height: 100%;
	}

	.profile-info {
		flex: 1;
	}

	.profile-info :global([data-user-name]) {
		font-weight: 600;
		color: #1a1a1a;
		display: block;
		margin-bottom: 0.25rem;
	}

	.profile-about {
		font-size: 0.875rem;
		color: #6b7280;
		margin: 0;
		line-height: 1.4;
	}

	/* Feed Tab */
	.feed-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.feed-item {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
	}

	.feed-author {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.75rem;
	}

	.feed-author :global([data-user-root]) {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.feed-avatar {
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.feed-avatar :global([data-user-avatar]) {
		width: 100%;
		height: 100%;
	}

	.feed-author :global([data-user-name]) {
		font-weight: 500;
		color: #1a1a1a;
	}

	.feed-author time {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-left: auto;
	}

	.feed-content {
		margin: 0;
		line-height: 1.6;
		white-space: pre-wrap;
		word-break: break-word;
	}

	/* Lessons Tab */
	.lessons-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.lesson-card {
		background: white;
		border-radius: 12px;
		padding: 1.5rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e5e5;
	}

	.lesson-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.lesson-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1a1a1a;
		line-height: 1.4;
	}

	.lesson-category {
		flex-shrink: 0;
		font-size: 0.75rem;
		background: #eef2ff;
		color: #6366f1;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		font-weight: 500;
		white-space: nowrap;
	}

	.lesson-summary {
		margin: 0 0 1rem 0;
		color: #4b5563;
		font-size: 0.9375rem;
		line-height: 1.6;
		font-weight: 500;
	}

	.lesson-content {
		background: #f9fafb;
		border-radius: 8px;
		padding: 1rem;
		margin-bottom: 1rem;
		border: 1px solid #f3f4f6;
	}

	.lesson-content p {
		margin: 0;
		font-size: 0.875rem;
		line-height: 1.7;
		color: #374151;
		white-space: pre-wrap;
		word-break: break-word;
	}

	.lesson-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-bottom: 1rem;
	}

	.lesson-tag {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
	}

	.lesson-footer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 0.75rem;
		border-top: 1px solid #f3f4f6;
	}

	.lesson-author {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.lesson-author :global([data-user-name]) {
		font-size: 0.875rem;
		font-weight: 500;
		color: #4b5563;
	}

	.lesson-avatar {
		width: 28px;
		height: 28px;
		flex-shrink: 0;
	}

	.lesson-avatar :global([data-user-avatar]) {
		width: 100%;
		height: 100%;
	}

	.lesson-footer time {
		font-size: 0.75rem;
		color: #9ca3af;
		margin-left: auto;
	}

	/* Empty State */
	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	/* Footer */
	.page-footer {
		margin-top: 3rem;
		padding-top: 2rem;
		border-top: 1px solid #e5e5e5;
	}
</style>
