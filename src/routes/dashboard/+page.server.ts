import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { fetchCodeforcesStats, fetchGithubStats, fetchLeetCodeStats, processCodeforcesWeakness } from '$lib/server/platforms';

export const actions = {
    getPlatformStats: async ({ request }) => {
        const data = await request.formData();
        const platform = data.get('platform');
        const username = data.get('username');

        if (!platform || !username) {
            return fail(400, { message: 'Platform and username are required' });
        }

        if (platform === 'codeforces') {
            const stats = await fetchCodeforcesStats(username.toString());
            if (!stats) {
                return fail(404, { message: 'User not found or API error' });
            }

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
            const stats = await fetchLeetCodeStats(username.toString());
            if (!stats){
                return fail(404, { message: 'User not found or API error' });
            }
            return {
                success: true,
                platform: 'leetcode',
                data: {
                    ...stats
                }
            };
        }
        else if(platform == 'github'){
            const stats = await fetchGithubStats(username.toString());
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
