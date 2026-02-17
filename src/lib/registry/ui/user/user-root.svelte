<script lang="ts">
	import { setContext } from 'svelte';
	import type { NDKUser, NDKUserProfile } from '@nostr-dev-kit/ndk';
	import type { NDKSvelte } from '@nostr-dev-kit/svelte';
	import type { Snippet } from 'svelte';
	import { USER_CONTEXT_KEY, type UserContext } from './user.context.js';
	import { cn } from '../../utils/cn.js';

	interface Props {
		ndk: NDKSvelte;
		user?: NDKUser;
		npub?: string;
		pubkey?: string;
		profile?: NDKUserProfile | null;
		onclick?: (e: MouseEvent) => void;
		class?: string;
		children?: Snippet;
	}

	let {
		ndk,
		user,
		npub,
		pubkey,
		profile: profileProp,
		onclick,
		class: className,
		children
	}: Props = $props();

	// Resolve NDKUser from available identifiers
	const ndkUser = $derived.by(() => {
		if (user) return user;
		if (npub) return ndk.getUser({ npub });
		if (pubkey) return ndk.getUser({ pubkey });
		return null;
	});

	// Fetch profile if not provided - using NDKUser.fetchProfile() method
	let fetchedProfile = $state<NDKUserProfile | null>(null);

	$effect(() => {
		if (ndkUser && !profileProp) {
			ndkUser.fetchProfile().then((p) => {
				fetchedProfile = p;
			});
		}
	});

	const profile = $derived(profileProp ?? fetchedProfile);

	// Create context
	const context: UserContext = $derived({
		ndk,
		user,
		ndkUser,
		profile,
		onclick
	});

	setContext(USER_CONTEXT_KEY, {
		get value() {
			return context;
		}
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
<div class={cn(className)} style="display: contents" data-user-root onclick={onclick}>
	{#if children}
		{@render children()}
	{/if}
</div>
