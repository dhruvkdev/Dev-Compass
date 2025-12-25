import { db } from '$lib/server/db';
import { user, platform_handles, account } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

import { fetchLeetCodeStats, fetchCodeforcesStats, fetchGithubStats, fetchGFGStats, fetchAtCoderStats } from '$lib/server/platforms';

interface RichPayload {
    user_context: {
        username: string;
        current_goal: string;
    };
    dsa_stats?: any;
    cp_stats?: any;
    dev_profile?: any;
    // Add other platforms as needed
}

export async function getRichPayload(userId: string): Promise<RichPayload> {
    // 1. Fetch User Context
    const [userData] = await db.select().from(user).where(eq(user.id, userId));
    const handlesData = await db.select().from(platform_handles).where(eq(platform_handles.userId, userId));

    // Create handles map
    const handles: Record<string, string> = {};
    for (const h of handlesData) {
        handles[h.platform] = h.handle;
    }

    // 2. Fetch Github Token if available
    let githubToken: string | undefined;
    if (handles['github']) {
        const [acc] = await db.select().from(account)
            .where(and(eq(account.userId, userId), eq(account.providerId, 'github')));
        githubToken = acc?.accessToken ?? undefined;
    }

    // 3. Fetch Data from Platforms (in parallel)
    const [leetcode, codeforces, github, gfg, atcoder] = await Promise.all([
        handles['leetcode'] ? fetchLeetCodeStats(handles['leetcode']) : null,
        handles['codeforces'] ? fetchCodeforcesStats(handles['codeforces']) : null,
        handles['github'] ? fetchGithubStats(handles['github'], githubToken) : null,
        handles['geeksforgeeks'] ? fetchGFGStats(handles['geeksforgeeks']) : null,
        handles['atcoder'] ? fetchAtCoderStats(handles['atcoder']) : null
    ]);

    // 4. Construct Payload
    return {
        user_context: {
            username: userData.name,
            current_goal: userData.goal || "Not specified"
        },
        dsa_stats: {
            leetcode,
            geeksforgeeks: gfg
        },
        cp_stats: {
            codeforces,
            atcoder
        },
        dev_profile: {
            github
        }
    };
}
