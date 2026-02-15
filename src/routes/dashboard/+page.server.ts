import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { platform_handles } from '$lib/server/db/schema';
import { and, eq, gte, isNotNull, lte, notInArray, sql } from "drizzle-orm";
import { getCodeforcesProblems, getCodeforcesProblemsByRating } from "$lib/server/recommendations/codeforces";
import {  getLeetcodeProblemsScored } from "$lib/server/recommendations/leetcode";
import { getLeetcodeTargetDifficulties, getSolvedLeetcodeSlugs, processLeetcodeWeakness } from "$lib/utils/platforms/leetcode";
import { scoreProblems } from "$lib/server/recommendations/score";


import { 
    getCodeforcesStatsCached, 
    getLeetCodeStatsCached, 
    getGithubStatsCached 
} from '$lib/server/cache';
import { processCodeforcesWeakness } from '$lib/server/platforms';
import { log } from 'console';
import { get } from 'http';

import type { PlatformData, CodeforcesDashboardData, GithubAnalysis } from '$lib/types';
import { normalizeTag } from '$lib/utils/normalise';
import { analyzeGithubSnapshot, generateGithubRecommendations, ingestGithubSnapshot } from '$lib/server/recommendations/github';


type CodeforcesUserProfile = {
  rating: number;
  maxRating: number;
  weakTags: string[];
  solvedProblemIds: Set<number>;
};

function getTargetRating(userRating: number) {
  if (userRating < 1200) return userRating + 100;
  if (userRating < 1600) return userRating + 150;
  if (userRating < 2000) return userRating + 200;
  return userRating + 250;
}

function getAttemptedProblemIds(submissions: any[]): Set<string> {
    const attempted = new Set<string>();

    for (const sub of submissions) {
        if (!sub.problem?.contestId || !sub.problem?.index) continue;
        const id = `${sub.problem.contestId}-${sub.problem.index}`;
        attempted.add(id);
    }

    return attempted;
}


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
        return { 
            platforms: [], 
            hasVerifiedPlatforms: false, 
            leetcodeSync: null 
        };
    }

    // Fetch stats for each verified platform in parallel
    let leetcodeGapDetected = false;
    let leetcodeLastSyncedAtISO: string | null = null;
    let leetcodeNeedsInitialImport = false;

    const platformPromises = verifiedPlatforms.map(async (p): Promise<PlatformData | null> => {
        try {
            switch (p.platform) {
                case 'github': {
                    const data = await ingestGithubSnapshot(userId, p.handle);
                    if (!data) return null;
                    const analysis = await analyzeGithubSnapshot(data);
                    const recommendations = await generateGithubRecommendations(analysis);
                    return { platform: 'github', handle: p.handle, data: data as any, githubRecommendations: recommendations };
                }
                case 'codeforces': {
                    const result = await getCodeforcesStatsCached(p.handle);
                    if (!result.success) return null; // Or handle error in UI if needed, but for now filtering out failed ones from main view might be safer or we could return error state
                    
                    const cfProblems = await getCodeforcesProblems();
                    // console.log(cfProblems);
                    const currentRating = Math.max(Number((result.data as any).info.rating), 800);
                    const target = getTargetRating(currentRating);
                    const stats = result.data;
                    const weakTags = processCodeforcesWeakness(stats.submissions);
                    // console.log(weakTags);
                    const weakTagNames = weakTags.map(t => t.tag);
                    // console.log(weakTagNames);
                    
                    const attemptedProblemIds = getAttemptedProblemIds(stats.submissions);
                    // console.log(Array.from(attemptedProblemIds));
                    const cfProblemsByRatingInitial = await getCodeforcesProblemsByRating(target - 100, target + 100, Array.from(attemptedProblemIds), weakTagNames);
                    const cfProblemsByRating = scoreProblems(cfProblemsByRatingInitial, weakTagNames, target, 3)
                        .map(p => ({ ...p, platform: 'codeforces' as const, score: p.score ?? 0 }));

                    return { 
                        platform: 'codeforces', 
                        handle: p.handle,
                        data: { ...stats, weakTags, cfProblemsByRating} 
                    };
                }
                case 'leetcode': {
                    const result = await getLeetCodeStatsCached(p.handle, userId);
                    if (!result) return null;

                    leetcodeGapDetected = result.gapDetected;
                    leetcodeLastSyncedAtISO = result.lastSyncedAt?.toISOString() ?? null;
                    leetcodeNeedsInitialImport = result.solvedCount === 0;

                    const weakTags = processLeetcodeWeakness(result.stats);
                    const normalizedWeakTags = weakTags.map(normalizeTag);
                    const solvedSlugs = await getSolvedLeetcodeSlugs(userId);
                    const difficulties = getLeetcodeTargetDifficulties(result.stats);
                    const rawRecommended = await getLeetcodeProblemsScored(solvedSlugs, normalizedWeakTags);
                    const recommendedProblems = rawRecommended.map(p => ({
                        ...p,
                        platform: 'leetcode' as const,
                        score: p.score ?? 0,
                        rating: p.rating ?? 1400
                    }));

                    return { 
                        platform: 'leetcode', 
                        handle: p.handle, 
                        data: result.stats, 
                        recommendedProblems
                    };
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
        hasVerifiedPlatforms: true,
        leetcodeSync: {
            gapDetected: leetcodeGapDetected,
            lastSyncedAt: leetcodeLastSyncedAtISO,
            needsInitialImport: leetcodeNeedsInitialImport
        }
    };
};

