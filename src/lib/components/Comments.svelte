<script lang="ts">
	import { ndk, COMMENT_KIND } from '$lib/ndk';
	import type { NDKEvent } from '@nostr-dev-kit/ndk';
	import { NDKEvent as NDKEventClass } from '@nostr-dev-kit/ndk';

	interface Props {
		/** The parent event to show/add comments for */
		parentEvent: NDKEvent;
	}

	let { parentEvent }: Props = $props();

	// Get current user from NDK
	let currentUser = $derived(ndk.activeUser);

	// State for new comment
	let newComment = $state('');
	let isSubmitting = $state(false);
	let submitError = $state<string | null>(null);

	// Subscribe to comments for this event (NIP-22 kind 1111)
	// Comments reference the parent with 'e' tag
	// Using storeSubscribe for reactive Svelte store
	const commentsSubscription = ndk.storeSubscribe(
		{
			kinds: [COMMENT_KIND as number],
			'#e': [parentEvent.id]
		},
		{ closeOnEose: false }
	);

	// Sort comments by date (newest first)
	const sortedComments = $derived(
		[...$commentsSubscription].sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0))
	);

	async function submitComment() {
		if (!newComment.trim() || !currentUser) return;

		isSubmitting = true;
		submitError = null;

		try {
			// Create a new comment event using NDK Svelte's NDKEvent
			const commentEvent = new NDKEventClass(ndk);
			commentEvent.kind = COMMENT_KIND;
			commentEvent.content = newComment.trim();

			// Set up NIP-22 tags manually for comment
			// Root reference (uppercase tags point to the root)
			commentEvent.tags.push(['E', parentEvent.id]);
			commentEvent.tags.push(['K', String(parentEvent.kind)]);
			if (parentEvent.pubkey) {
				commentEvent.tags.push(['P', parentEvent.pubkey]);
			}

			// Parent reference (lowercase tags point to immediate parent)
			commentEvent.tags.push(['e', parentEvent.id]);
			commentEvent.tags.push(['k', String(parentEvent.kind)]);
			if (parentEvent.pubkey) {
				commentEvent.tags.push(['p', parentEvent.pubkey]);
			}

			// Publish the comment
			await commentEvent.publish();

			// Clear the input
			newComment = '';
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Failed to post comment';
		} finally {
			isSubmitting = false;
		}
	}

	function formatDate(timestamp: number | undefined): string {
		if (!timestamp) return '';
		return new Date(timestamp * 1000).toLocaleString();
	}
</script>

<section class="comments-section">
	<h3>Comments ({sortedComments.length})</h3>

	{#if currentUser}
		<form class="comment-form" onsubmit={(e) => { e.preventDefault(); submitComment(); }}>
			<textarea
				bind:value={newComment}
				placeholder="Add a comment... (plain text only)"
				rows="3"
				disabled={isSubmitting}
			></textarea>
			<div class="form-actions">
				{#if submitError}
					<span class="error">{submitError}</span>
				{/if}
				<button type="submit" disabled={isSubmitting || !newComment.trim()}>
					{isSubmitting ? 'Posting...' : 'Post Comment'}
				</button>
			</div>
		</form>
	{:else}
		<p class="login-prompt">Login to add comments</p>
	{/if}

	<div class="comments-list">
		{#each sortedComments as comment (comment.id)}
			<article class="comment">
				<header>
					<span class="author">{comment.author.npub.slice(0, 12)}...</span>
					<time datetime={new Date((comment.created_at ?? 0) * 1000).toISOString()}>
						{formatDate(comment.created_at)}
					</time>
				</header>
				<p class="content">{comment.content}</p>
			</article>
		{:else}
			<p class="no-comments">No comments yet. Be the first to comment!</p>
		{/each}
	</div>
</section>

<style>
	.comments-section {
		margin-top: 1.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e5e5e5;
	}

	h3 {
		margin: 0 0 1rem 0;
		font-size: 1rem;
		color: #1a1a1a;
	}

	.comment-form {
		margin-bottom: 1.5rem;
	}

	textarea {
		width: 100%;
		padding: 0.75rem;
		font-size: 0.9rem;
		border: 1px solid #e5e5e5;
		border-radius: 8px;
		resize: vertical;
		font-family: inherit;
	}

	textarea:focus {
		outline: 2px solid #6366f1;
		outline-offset: -1px;
		border-color: transparent;
	}

	textarea:disabled {
		background: #f9fafb;
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		align-items: center;
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.form-actions button {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		background: #6366f1;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
	}

	.form-actions button:hover:not(:disabled) {
		background: #4f46e5;
	}

	.form-actions button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.error {
		color: #dc2626;
		font-size: 0.875rem;
	}

	.login-prompt {
		color: #6b7280;
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}

	.comments-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.comment {
		background: #f9fafb;
		border-radius: 8px;
		padding: 1rem;
	}

	.comment header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.author {
		font-size: 0.8rem;
		font-weight: 500;
		color: #6366f1;
	}

	.comment time {
		font-size: 0.75rem;
		color: #9ca3af;
	}

	.comment .content {
		margin: 0;
		font-size: 0.9rem;
		line-height: 1.5;
		white-space: pre-wrap;
	}

	.no-comments {
		color: #9ca3af;
		font-size: 0.9rem;
		text-align: center;
		padding: 2rem;
	}
</style>
