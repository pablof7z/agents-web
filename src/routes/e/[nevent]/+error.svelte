<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="error-container">
	<div class="error-content">
		<h1>{page.status}</h1>
		<p class="message">{page.error?.message ?? 'An error occurred'}</p>
		<a href="/" class="back-link">&larr; Back to Home</a>
	</div>
</div>

<style>
	.error-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		padding: 2rem;
	}

	.error-content {
		text-align: center;
		max-width: 400px;
	}

	h1 {
		font-size: 4rem;
		color: #dc2626;
		margin: 0 0 1rem 0;
	}

	.message {
		font-size: 1.125rem;
		color: #6b7280;
		margin: 0 0 2rem 0;
	}

	.back-link {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background: #6366f1;
		color: white;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 500;
		transition: background 0.15s ease;
	}

	.back-link:hover {
		background: #4f46e5;
	}
</style>
