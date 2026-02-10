import { defineConfig } from 'jsrepo';

export default defineConfig({
    registries: ['@nostr/svelte@0.0.59'],
    paths: {
        'ui': './src/lib/components/ui',
        'components': './src/lib/components',
        'utils': './src/lib/utils',
        'builders': './src/lib/builders',
        'hooks': './src/lib/hooks',
        'actions': './src/lib/actions',
        'stores': './src/lib/stores'
    },
});