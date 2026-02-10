import Root from './user-root.svelte';
import Avatar from './user-avatar.svelte';
import Name from './user-name.svelte';

export type { UserContext } from './user.context.js';
export { USER_CONTEXT_KEY } from './user.context.js';

export const User = {
	Root,
	Avatar,
	Name
};

export { Root as UserRoot, Avatar as UserAvatar, Name as UserName };
