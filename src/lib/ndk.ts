import { NDKSvelte } from '@nostr-dev-kit/svelte';

// Default relays for the application
const DEFAULT_RELAYS = [
	'wss://tenex.chat'
];

// Create NDK Svelte instance - this provides reactive stores
// Note: NDK Svelte handles browser-only initialization internally
export const ndk = new NDKSvelte({
	explicitRelayUrls: DEFAULT_RELAYS,
	autoConnectUserRelays: true
});

// Connect to relays immediately when module loads (browser only)
// NDK handles reconnections automatically; this is idempotent
if (typeof window !== 'undefined') {
	ndk.connect();
}

// Export stores from NDK Svelte for reactive access
// These are automatically available from the ndk instance:
// - ndk.pool - Relay pool with connection status
// - ndk.sessions - Session management for multiple accounts
// - ndk.currentUser - Currently active user
// - ndk.wallet - Wallet integration (NIP-60)

// Agent Definition event kind (custom TENEX)
export const AGENT_DEFINITION_KIND = 4199;

// Agent Lesson event kind (custom TENEX)
export const AGENT_LESSON_KIND = 4129;

// Comment event kind (NIP-22)
export const COMMENT_KIND = 1111;
