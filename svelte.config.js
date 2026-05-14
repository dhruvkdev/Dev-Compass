import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		// Production form actions compare Origin to the app URL; Docker uses :8080, Vite uses :5173.
		csrf: {
			trustedOrigins: [
				'http://localhost:8080',
				'http://127.0.0.1:8080',
				'http://localhost:5173',
				'http://127.0.0.1:5173'
			]
		},
		alias: {
			'@/*': './path/to/lib/*'
		}
	}	
};

export default config;
