<script lang="ts">
	import type { NDKEvent } from '@nostr-dev-kit/ndk';

	interface Props {
		event: NDKEvent;
		onclick?: () => void;
	}

	let { event, onclick }: Props = $props();

	// Extract lesson details from tags
	const title = $derived(event.tagValue('title') ?? 'Untitled Lesson');
	const summary = $derived(event.tagValue('summary') ?? '');
	const category = $derived(event.tagValue('category') ?? 'General');
	const hashtags = $derived(event.getMatchingTags('hashtag').map(([, tag]: string[]) => tag));
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
<article class="lesson-card" role="button" tabindex="0" {onclick} onkeydown={(e) => e.key === 'Enter' && onclick?.()}>
	<header>
		<span class="category">{category}</span>
		<h3>{title}</h3>
	</header>

	{#if summary}
		<p class="summary">{summary}</p>
	{/if}

	{#if hashtags.length > 0}
		<div class="tags">
			{#each hashtags as tag}
				<span class="tag">#{tag}</span>
			{/each}
		</div>
	{/if}

	<footer>
		<time datetime={new Date(event.created_at! * 1000).toISOString()}>
			{new Date(event.created_at! * 1000).toLocaleDateString()}
		</time>
	</footer>
</article>

<style>
	.lesson-card {
		background: white;
		border-radius: 12px;
		padding: 1.25rem;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
		border: 1px solid #e5e5e5;
	}

	.lesson-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.lesson-card:focus {
		outline: 2px solid #10b981;
		outline-offset: 2px;
	}

	header {
		margin-bottom: 0.75rem;
	}

	.category {
		display: inline-block;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: #ecfdf5;
		color: #059669;
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		margin-bottom: 0.5rem;
	}

	h3 {
		margin: 0;
		font-size: 1.1rem;
		color: #1a1a1a;
	}

	.summary {
		margin: 0 0 0.75rem 0;
		color: #4b5563;
		font-size: 0.875rem;
		line-height: 1.5;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.tag {
		font-size: 0.75rem;
		color: #6b7280;
		background: #f9fafb;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
	}

	footer {
		border-top: 1px solid #f3f4f6;
		padding-top: 0.5rem;
	}

	time {
		font-size: 0.75rem;
		color: #9ca3af;
	}
</style>
