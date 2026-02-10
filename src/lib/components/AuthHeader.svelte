<script lang="ts">
	import { ndk } from '$lib/ndk';
	import { NDKNip07Signer } from '@nostr-dev-kit/ndk';

	// Reactive current user from NDK Svelte
	let currentUser = $derived(ndk.activeUser);

	let isLoggingIn = $state(false);
	let loginError = $state<string | null>(null);

	async function login() {
		if (typeof window === 'undefined' || !window.nostr) {
			loginError = 'No Nostr extension found. Please install a NIP-07 extension like Alby or nos2x.';
			return;
		}

		isLoggingIn = true;
		loginError = null;

		try {
			const signer = new NDKNip07Signer();
			ndk.signer = signer;
			const user = await signer.user();
			ndk.activeUser = user;
		} catch (e) {
			loginError = e instanceof Error ? e.message : 'Failed to login';
		} finally {
			isLoggingIn = false;
		}
	}

	function logout() {
		ndk.signer = undefined;
		ndk.activeUser = undefined;
	}

	// Derive display name from profile or pubkey
	const displayName = $derived(() => {
		if (!currentUser) return '';
		// If profile is loaded, use name; otherwise show truncated pubkey
		const profile = currentUser.profile;
		if (profile?.name) return profile.name;
		if (profile?.displayName) return profile.displayName;
		return currentUser.npub.slice(0, 12) + '...';
	});
</script>

<header class="auth-header">
	<div class="logo">
		<a href="/">Agents Web</a>
	</div>

	<div class="auth-controls">
		{#if currentUser}
			<div class="user-info">
				<span class="user-name">{displayName()}</span>
				<button class="btn btn-secondary" onclick={logout}>
					Logout
				</button>
			</div>
		{:else}
			<button class="btn btn-primary" onclick={login} disabled={isLoggingIn}>
				{isLoggingIn ? 'Connecting...' : 'Login with Extension'}
			</button>
		{/if}
	</div>

	{#if loginError}
		<div class="error-toast">
			{loginError}
			<button onclick={() => (loginError = null)}>&times;</button>
		</div>
	{/if}
</header>

<style>
	.auth-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 2rem;
		background: white;
		border-bottom: 1px solid #e5e5e5;
		position: relative;
	}

	.logo a {
		font-size: 1.25rem;
		font-weight: 700;
		color: #1a1a1a;
		text-decoration: none;
	}

	.logo a:hover {
		color: #6366f1;
	}

	.auth-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-info {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.user-name {
		font-size: 0.9rem;
		color: #4b5563;
	}

	.btn {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		border-radius: 8px;
		cursor: pointer;
		transition: background 0.15s ease, opacity 0.15s ease;
		border: none;
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #6366f1;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #4f46e5;
	}

	.btn-secondary {
		background: #f3f4f6;
		color: #4b5563;
	}

	.btn-secondary:hover {
		background: #e5e7eb;
	}

	.error-toast {
		position: absolute;
		top: 100%;
		right: 2rem;
		margin-top: 0.5rem;
		background: #fef2f2;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		font-size: 0.875rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
	}

	.error-toast button {
		background: none;
		border: none;
		font-size: 1.25rem;
		cursor: pointer;
		color: #dc2626;
		line-height: 1;
		padding: 0;
	}
</style>
