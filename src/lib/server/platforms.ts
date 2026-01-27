import { env } from '$env/dynamic/private';

import { leetCodeClient } from '$lib/server/leetcode/client';
import type { LeetCodeStats } from '$lib/server/leetcode/types';
import type { GithubStats } from '$lib/server/github/types';

// Re-export type for use in other files if needed, or consumers should import from types
export type { LeetCodeStats };
type GithubGraphQLResponse = {
  data?: {
    user?: GithubStats;
  };
  errors?: { message: string }[];
};

export async function fetchLeetCodeStats(username: string): Promise<LeetCodeStats | null> {
    return leetCodeClient.fetchUser(username);
}

// --- GITHUB (GraphQL > REST) ---
export async function fetchGithubStats(username: string):Promise<GithubStats | null> {
    try {
        const query = `
            query ($username: String!) {
                user(login: $username) {
                    login
                    createdAt
                    followers { totalCount }

                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    date
                                    contributionCount
                                }
                            }
                        }
                        pullRequestContributions { totalCount }
                        issueContributions { totalCount }
                        pullRequestReviewContributions { totalCount }
                    }

                    repositories(
                    first: 20,
                    orderBy: { field: STARGAZERS, direction: DESC },
                    ownerAffiliations: OWNER
                    ) {
                        totalCount  
                        nodes {
                            name
                            stargazerCount
                            forkCount
                            createdAt
                            isArchived
                            languages(first: 5) {
                            edges {
                                size
                                node { name }
                            }
                        }
                        defaultBranchRef {
                            target {
                                ... on Commit {
                                history(first: 0) {
                                    totalCount
                                }
                            }
                        }
                        }
                    }
                    }

                    pinnedItems(first: 4, types: [REPOSITORY]) {
                        nodes {
                            ... on Repository {
                            name
                            description
                            stargazerCount
                            forkCount
                            languages(first: 3) { nodes { name } }
                            }
                        }
                    }
                }
            }

        `;

        const res = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${env.GITHUB_PAT}`, // Requires a generic GITHUB_TOKEN or user's token
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, variables: { username } })
        });

        const json = (await res.json()) as GithubGraphQLResponse;
        if (json.errors?.length) {
            console.error(json.errors);
            return null;
        }
        return json.data?.user ?? null;
        
    } catch (e) {
        console.error("GitHub GraphQL Error:", e);
        return null;
    }
}

// --- CODEFORCES ---
export async function fetchCodeforcesStats(username: string) {
    try {
        const [userRes, ratingRes, statusRes] = await Promise.all([
            fetch(`https://codeforces.com/api/user.info?handles=${username}`),
            fetch(`https://codeforces.com/api/user.rating?handle=${username}`),
            fetch(`https://codeforces.com/api/user.status?handle=${username}&from=1&count=5000`)
        ]);

        const userData = await userRes.json();
        const ratingData = await ratingRes.json();
        const statusData = await statusRes.json();

        if (userData.status !== 'OK') return null;

        return {
            info: userData.result[0],
            rating: ratingData.status === 'OK' ? ratingData.result : [],
            submissions: statusData.status === 'OK' ? statusData.result : []
        };
    } catch (e) {
        console.error('Codeforces Fetch Error:', e);
        return null;
    }
}

// Helper to find weak tags based on failed submissions
export function processCodeforcesWeakness(submissions: any[]) {
    if (!submissions || submissions.length === 0) return [];

    const failTags: Record<string, number> = {};
    const totalTags: Record<string, number> = {};

    // Look at all fetched submissions (limit for perf if needed, but 5000 is okay)
    for (const sub of submissions) {
        if (sub.problem.tags) {
            for (const tag of sub.problem.tags) {
                if (tag === 'implementation') continue; // too generic

                totalTags[tag] = (totalTags[tag] || 0) + 1;
                if (sub.verdict !== 'OK') {
                    failTags[tag] = (failTags[tag] || 0) + 1;
                }
            }
        }
    }

    // Calculate failure rate
    const weakness = Object.keys(totalTags).map(tag => {
        const failed = failTags[tag] || 0;
        const total = totalTags[tag];
        return {
            tag,
            failed,
            total,
            rate: failed / total
        };
    });

    // Sort by rate desc, then by count desc (to avoid 1/1 100% being top)
    return weakness
        .filter(w => w.total > 5) // Minimum attempts to count as weakness
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 5);
}

// --- ATCODER (Kenkoooo API) ---
// Kenkoooo is the best.
export async function fetchAtCoderStats(username: string) {
    try {
        // 1. Basic Info
        const infoRes = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/info?user=${username}`);
        // 2. Algorithm Rating
        const ratingRes = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/rating?user=${username}`);

        const info = await infoRes.json();
        const rating = await ratingRes.json();

        return { info, rating };
    } catch (e) {
        return null;
    }
}

// --- GFG (Placeholder) ---
export async function fetchGFGStats(username: string) {
    return null;
}