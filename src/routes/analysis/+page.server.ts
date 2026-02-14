import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { platform_handles } from '$lib/server/db/schema';
import { eq, isNotNull, and } from 'drizzle-orm';
import { 
    getCodeforcesStatsCached, 
    getLeetCodeStatsCached, 
    getGithubStatsCached 
} from '$lib/server/cache';
import { processCodeforcesWeakness } from '$lib/server/platforms';

// Types for platform data
type PlatformData = {
    platform: string;
    handle: string;
    data: unknown;
};

export const load: PageServerLoad = async ({ locals }) => {
    if (!locals.user) throw redirect(302, '/signin');

    const userId = locals.user.id;

    // Fetch verified platforms from database
    const verifiedPlatforms = await db
        .select()
        .from(platform_handles)
        .where(
            and(
                eq(platform_handles.userId, userId),
                isNotNull(platform_handles.verifiedAt)
            )
        );

    if (verifiedPlatforms.length === 0) {
        return { platforms: [], hasVerifiedPlatforms: false };
    }

    // Fetch stats for each verified platform in parallel
    const platformPromises = verifiedPlatforms.map(async (p): Promise<PlatformData | null> => {
        try {
            switch (p.platform) {
                case 'github': {
                    const data = await getGithubStatsCached(p.handle);
                    return data ? { platform: 'github', handle: p.handle, data } : null;
                }
                case 'codeforces': {
                    const result = await getCodeforcesStatsCached(p.handle);
                    if (!result.success) return null; // Or handle error in UI if needed, but for now filtering out failed ones from main view might be safer or we could return error state
                    
                    const stats = result.data;
                    const weakTags = processCodeforcesWeakness(stats.submissions);
                    return { 
                        platform: 'codeforces', 
                        handle: p.handle, 
                        data: { ...stats, weakTags } 
                    };
                }
                case 'leetcode': {
                    const result = await getLeetCodeStatsCached(p.handle);
                    return result ? { platform: 'leetcode', handle: p.handle, data: result.stats } : null;
                }
                default:
                    return null;
            }
        } catch (e) {
            console.error(`Failed to fetch ${p.platform} stats for ${p.handle}:`, e);
            return null;
        }
    });

    const results = await Promise.all(platformPromises);
    const platforms = results.filter((r): r is PlatformData => r !== null);

    return { 
        platforms, 
        hasVerifiedPlatforms: true 
    };
};

export const actions = {
    getPlatformStats: async ({ request }) => {
        const data = await request.formData();
        const platform = data.get('platform');
        const username = data.get('username');

        if (!platform || !username) {
            return fail(400, { message: 'Platform and username are required' });
        }

        if (platform === 'codeforces') {
            const result = await getCodeforcesStatsCached(username.toString());
            
            if (!result.success) {
                 return fail(400, { message: result.error });
            }

            const stats = result.data;

            // Process additional stats
            const weakTags = processCodeforcesWeakness(stats.submissions);

            return {
                success: true,
                platform: 'codeforces',
                data: {
                    ...stats,
                    weakTags
                }
            };
        }
        else if(platform == 'leetcode'){
            const result = await getLeetCodeStatsCached(username.toString());
            if (!result){
                return fail(404, { message: 'User not found or API error' });
            }
            return {
                success: true,
                platform: 'leetcode',
                data: {
                    ...result.stats
                }
            };
        }
        else if(platform == 'github'){
            const stats = await getGithubStatsCached(username.toString());
            if (!stats){
                return fail(404, { message: 'User not found or API error' });
            }
            return {
                success: true,
                platform: 'github',
                data: {
                    ...stats
                }
            };
        }

        return fail(400, { message: 'Platform not supported yet' });
    }
} satisfies Actions;
