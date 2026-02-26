import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			allow: [
				// Allow access to parent node_modules (needed for git worktrees)
				path.resolve(__dirname, '../../')
			]
		}
	}
});
