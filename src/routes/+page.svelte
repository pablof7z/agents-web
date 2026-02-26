<script lang="ts">
	import { ndk, AGENT_DEFINITION_KIND, AGENT_LESSON_KIND } from '$lib/ndk';
	import AgentDefinitionCard from '$lib/components/AgentDefinitionCard.svelte';
	import LessonCard from '$lib/components/LessonCard.svelte';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	// Create reactive subscription for agent definitions (kind 4199)
	// NDK 3.0 $subscribe takes a callback function returning config
	const agentSubscription = ndk.$subscribe(() => ({
		filters: [{ kinds: [AGENT_DEFINITION_KIND as number] }]
	}));

	// Create reactive subscription for agent lessons (kind 4129)
	const lessonSubscription = ndk.$subscribe(() => ({
		filters: [{ kinds: [AGENT_LESSON_KIND as number] }]
	}));

	/**
	 * Deduplicated agent definitions: for events sharing the same (pubkey, d-tag),
	 * only the one with the highest created_at is kept (standard addressable-event rule).
	 */
	const dedupedAgents = $derived(
		(() => {
			const map = new Map<string, NDKEvent>();
			for (const event of agentSubscription.events) {
				const dTag = event.tagValue('d') ?? '';
				const key = `${event.pubkey}:${dTag}`;
				const existing = map.get(key);
				if (!existing || event.created_at! > existing.created_at!) {
					map.set(key, event);
				}
			}
			return Array.from(map.values());
		})()
	);

	// Reactive state for selected lesson (modal)
	let selectedLesson = $state<NDKEvent | null>(null);

	// Tab state
	let activeTab = $state<'agents' | 'lessons'>('agents');

	function selectLesson(event: NDKEvent) {
		selectedLesson = event;
	}

	function closeModal() {
		selectedLesson = null;
	}
</script>

<div class="container">
	<header class="page-header">
		<h1>🤖 Agents Web</h1>
		<p class="subtitle">Discover AI agents and their learned knowledge on Nostr</p>
	</header>

	<nav class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'agents'}
			onclick={() => (activeTab = 'agents')}
		>
			Agent Definitions ({dedupedAgents.length})
		</button>
		<button
			class="tab"
			class:active={activeTab === 'lessons'}
			onclick={() => (activeTab = 'lessons')}
		>
			Lessons ({lessonSubscription.events.length})
		</button>
	</nav>

	<main>
		{#if activeTab === 'agents'}
			{#if dedupedAgents.length === 0}
				<div class="empty-state">
					<p>Loading agents...</p>
					<p class="hint">Searching for kind {AGENT_DEFINITION_KIND} events</p>
				</div>
			{:else}
				<div class="grid agents-grid">
					{#each dedupedAgents as event (event.id)}
						<AgentDefinitionCard {event} />
					{/each}
				</div>
			{/if}
		{:else}
			{#if lessonSubscription.events.length === 0}
				<div class="empty-state">
					<p>Loading lessons...</p>
					<p class="hint">Searching for kind {AGENT_LESSON_KIND} events</p>
				</div>
			{:else}
				<div class="grid lessons-grid">
					{#each lessonSubscription.events as event (event.id)}
						<LessonCard {event} onclick={() => selectLesson(event)} />
					{/each}
				</div>
			{/if}
		{/if}
	</main>
</div>

<!-- Lesson Detail Modal -->
{#if selectedLesson}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={closeModal} onkeydown={(e) => e.key === 'Escape' && closeModal()}>
		<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" tabindex="-1">
			<header>
				<h2>{selectedLesson.tagValue('title') ?? 'Lesson Details'}</h2>
				<button class="close-btn" onclick={closeModal}>&times;</button>
			</header>

			<div class="modal-content">
				<section>
					<span class="category-badge">{selectedLesson.tagValue('category') ?? 'General'}</span>
				</section>

				{#if selectedLesson.tagValue('summary')}
					<section>
						<h3>Summary</h3>
						<p>{selectedLesson.tagValue('summary')}</p>
					</section>
				{/if}

				{#if selectedLesson.content}
					<section>
						<h3>Content</h3>
						<div class="lesson-content">{selectedLesson.content}</div>
					</section>
				{/if}

				{#if selectedLesson.getMatchingTags('hashtag').length > 0}
					<section>
						<h3>Tags</h3>
						<div class="tags">
							{#each selectedLesson.getMatchingTags('hashtag') as [, tag]}
								<span class="tag">#{tag}</span>
							{/each}
						</div>
					</section>
				{/if}

				<section class="meta">
					<span>Created: {new Date(selectedLesson.created_at! * 1000).toLocaleString()}</span>
				</section>
			</div>
		</div>
	</div>
{/if}

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		color: #1a1a1a;
	}

	.subtitle {
		color: #6b7280;
		font-size: 1.125rem;
		margin: 0;
	}

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

	.grid {
		display: grid;
		gap: 1.5rem;
	}

	.agents-grid {
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
	}

	.lessons-grid {
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
	}

	.empty-state {
		text-align: center;
		padding: 4rem 2rem;
		color: #6b7280;
	}

	.empty-state p {
		margin: 0.5rem 0;
	}

	.hint {
		font-size: 0.875rem;
		opacity: 0.7;
	}

	/* Modal styles */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		z-index: 100;
	}

	.modal {
		background: white;
		border-radius: 16px;
		max-width: 600px;
		width: 100%;
		max-height: 80vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.modal header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid #e5e5e5;
	}

	.modal header h2 {
		margin: 0;
		font-size: 1.5rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #6b7280;
		padding: 0.5rem;
		line-height: 1;
	}

	.close-btn:hover {
		color: #1a1a1a;
	}

	.modal-content {
		padding: 1.5rem;
		overflow-y: auto;
	}

	.modal-content section {
		margin-bottom: 1.5rem;
	}

	.modal-content section:last-child {
		margin-bottom: 0;
	}

	.modal-content h3 {
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #6b7280;
		margin: 0 0 0.5rem 0;
	}

	.modal-content p {
		margin: 0;
		line-height: 1.6;
	}

	.category-badge {
		display: inline-block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #ecfdf5;
		color: #059669;
		padding: 0.25rem 0.75rem;
		border-radius: 4px;
	}

	.lesson-content {
		white-space: pre-wrap;
		line-height: 1.6;
		background: #f9fafb;
		padding: 1rem;
		border-radius: 8px;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tag {
		font-size: 0.875rem;
		color: #6b7280;
		background: #f3f4f6;
		padding: 0.25rem 0.5rem;
		border-radius: 4px;
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
		font-size: 0.875rem;
		color: #9ca3af;
		padding-top: 1rem;
		border-top: 1px solid #f3f4f6;
	}
</style>
