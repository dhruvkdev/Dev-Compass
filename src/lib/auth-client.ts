import { createAuthClient } from 'better-auth/svelte';
export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: 'http://localhost:8080',
	trustedOrigins: [
        "http://localhost:5173", "http://localhost:8080"        // Local development
    ],
});

export const { signIn, signUp, useSession } = createAuthClient();
