<script lang="ts">
	import { getContext } from 'svelte';
	import { USER_CONTEXT_KEY, type UserContext } from './user.context.js';
	import { cn } from '../../utils/cn.js';

	interface Props {
		field?: 'displayName' | 'name' | 'both';
		class?: string;
	}

	let { field = 'displayName', class: className }: Props = $props();

	const contextRef = getContext<{ value: UserContext }>(USER_CONTEXT_KEY);
	if (!contextRef) {
		throw new Error('User.Name must be used within a User.Root component');
	}
	const context = $derived(contextRef.value);

	const displayText = $derived.by(() => {
		const profile = context.profile;
		const pubkey = context.ndkUser?.pubkey ?? '';
		const truncatedPubkey = pubkey ? pubkey.slice(0, 8) + '...' : '';

		if (field === 'displayName') {
			return profile?.displayName || profile?.name || truncatedPubkey;
		} else if (field === 'name') {
			return profile?.name || truncatedPubkey;
		} else if (field === 'both') {
			const displayName = profile?.displayName || profile?.name || truncatedPubkey;
			const name = profile?.name;
			if (name && displayName !== name) {
				return `${displayName} (@${name})`;
			}
			return displayName;
		}
		return truncatedPubkey;
	});
</script>

<span class={cn(className)} data-user-name>{displayText}</span>
