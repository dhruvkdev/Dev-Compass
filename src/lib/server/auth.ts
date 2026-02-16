import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { user, session, account, verification } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';

import * as static_env from '$env/static/private';

export const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET || "BUILD_TIME_SECRET_REPLACE_ME_IN_PROD",
    baseURL: env.BETTER_AUTH_URL || "http://localhost:5173",
    trustedOrigins: [env.BETTER_AUTH_URL || "http://localhost:5173"],
    
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: { user, session, account, verification }
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
        github: {
            clientId: static_env.GITHUB_CLIENT_ID || '',
            clientSecret: static_env.GITHUB_CLIENT_SECRET || ''
        },
        google: {
            clientId: static_env.GOOGLE_CLIENT_ID || '',
            clientSecret: static_env.GOOGLE_CLIENT_SECRET || ''
        }
    }
});