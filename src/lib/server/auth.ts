import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '$lib/server/db';
import { user, session, account, verification } from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';


export const auth = betterAuth({
    secret: env.BETTER_AUTH_SECRET || "BUILD_TIME_SECRET_REPLACE_ME_IN_PROD",
    baseURL: env.BETTER_AUTH_URL || "http://localhost:8080",
    trustedOrigins: [
        env.BETTER_AUTH_URL || "http://localhost:8080",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    
    database: drizzleAdapter(db, {
        provider: 'pg',
        schema: { user, session, account, verification }
    }),
    emailAndPassword: { enabled: true },
    socialProviders: {
        github: {
            clientId: env.GITHUB_CLIENT_ID || '',
            clientSecret: env.GITHUB_CLIENT_SECRET || ''
        },
        google: {
            clientId: env.GOOGLE_CLIENT_ID || '',
            clientSecret: env.GOOGLE_CLIENT_SECRET || ''
        }
    }
});