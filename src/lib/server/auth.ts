import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { user, session, account, verification } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

import {
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET
} from '$env/static/private';

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET!,
	baseURL: env.BETTER_AUTH_URL!,
	trustedOrigins: [env.BETTER_AUTH_URL!],
	database: drizzleAdapter(db, {
		provider: 'pg', // or "mysql", "sqlite"
		schema: {
			user,
			session,
			account,
			verification
		}
	}),
	emailAndPassword: {
		enabled: true
	},
	socialProviders: {
		github: {
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET
		},
		google: {
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET
		}
	}
});
