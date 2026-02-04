import { GET_USER_PROFILE, GET_SKILL_STATS, GET_LANGUAGE_STATS, GET_RECENT_SUBMISSIONS, GET_CONTEST_HISTORY } from './queries';
import type { LeetCodeStats, GQLUserProfileResponse, GQLSkillStatsResponse, GQLLanguageStatsResponse, GQLRecentSubmissionsResponse, GQLContestHistoryResponse, ContestRatingHistory } from './types';

const LEETCODE_ENDPOINT = 'https://leetcode.com/graphql';

// Rate Limit Config
const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

class LeetCodeClient {
    private headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://leetcode.com',
        'Origin': 'https://leetcode.com'
    };

    private async fetchGQL<T>(query: string, variables: Record<string, any>, retries = 0): Promise<T | null> {
        try {
            const res = await fetch(LEETCODE_ENDPOINT, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ query, variables })
            });

            if (res.status === 429) {
                if (retries >= MAX_RETRIES) {
                    console.warn(`LeetCode 429: Max retries reached for ${JSON.stringify(variables)}`);
                    return null;
                }
                const delay = BASE_DELAY_MS * Math.pow(2, retries);
                await new Promise(r => setTimeout(r, delay));
                return this.fetchGQL<T>(query, variables, retries + 1);
            }

            if (!res.ok) {
                console.error(`LeetCode API Error ${res.status}: ${res.statusText}`);
                return null;
            }

            const json = await res.json();
            if (json.errors) {
                console.warn('LeetCode GraphQL Errors:', json.errors);
                // Continue if partial data exists? Usually return null for critical errors.
                if (!json.data) return null;
            }

            return json as T;

        } catch (e) {
            console.error('LeetCode Network Error:', e);
            return null;
        }
    }

    public async fetchUser(username: string): Promise<LeetCodeStats | null> {
        console.log(`Fetching LeetCode stats for ${username}...`);

        // 2. Parallel Fetch
        const [profileRes, skillsRes, languagesRes, submissionsRes, contestRes] = await Promise.all([
            this.fetchGQL<GQLUserProfileResponse>(GET_USER_PROFILE, { username }),
            this.fetchGQL<GQLSkillStatsResponse>(GET_SKILL_STATS, { username }),
            this.fetchGQL<GQLLanguageStatsResponse>(GET_LANGUAGE_STATS, { username }),
            this.fetchGQL<GQLRecentSubmissionsResponse>(GET_RECENT_SUBMISSIONS, { username, limit: 20 }),
            this.fetchGQL<GQLContestHistoryResponse>(GET_CONTEST_HISTORY, { username })
        ]);

        // 3. Validation
        if (!profileRes?.data?.matchedUser) {
            return null;
        }

        const user = profileRes.data.matchedUser;
        const submitStats = user.submitStats.acSubmissionNum;
        const allQuestions = profileRes.data.allQuestionsCount;

        const getCount = (list: { difficulty: string; count: number }[], diff: string) =>
            list.find(x => x.difficulty === diff)?.count || 0;

        // 4. Normalization - Contest History
        let contestHistory: ContestRatingHistory = [];
        if (contestRes?.data?.userContestRankingHistory) {
            const history = contestRes.data.userContestRankingHistory.filter(c => c.attended);
            // Sort by start time just to be safe (LeetCode usually returns sorted but good to ensure for delta calc)
            history.sort((a, b) => a.contest.startTime - b.contest.startTime);

            contestHistory = history.map((point, i) => {
                const prevRating = i > 0 ? history[i - 1].rating : point.rating; // For first, delta is 0 effectively from itself, or we could handle differently.
                // Standard convention: Delta is diff from previous. First contest delta is usually 0 or hidden.
                // Let's make delta 0 for the first one for simplicity.
                const delta = i > 0 ? point.rating - prevRating : 0;

                return {
                    contestId: point.contest.startTime, // Use timestamp as ID as it's unique
                    contestName: point.contest.title,
                    date: point.contest.startTime,
                    rating: point.rating,
                    delta,
                    ranking: point.ranking
                };
            });
            console.log(`[LeetCode] Parsed ${contestHistory.length} contest records for ${username}`);
        } else {
            console.log(`[LeetCode] No contest history found for ${username}. Response:`, JSON.stringify(contestRes?.data));
        }

        // 4.5. Normalization - Stats
        const stats: LeetCodeStats = {
            profile: {
                username: user.username || username,
                ranking: user.profile.ranking || 0,
                totalSolved: getCount(submitStats, 'All'),
                easySolved: getCount(submitStats, 'Easy'),
                mediumSolved: getCount(submitStats, 'Medium'),
                hardSolved: getCount(submitStats, 'Hard'),
                totalQuestions: getCount(allQuestions, 'All'),
                easyQuestions: getCount(allQuestions, 'Easy'),
                mediumQuestions: getCount(allQuestions, 'Medium'),
                hardQuestions: getCount(allQuestions, 'Hard')
            },
            skills: skillsRes?.data?.matchedUser?.tagProblemCounts ? {
                advanced: skillsRes.data.matchedUser.tagProblemCounts.advanced,
                intermediate: skillsRes.data.matchedUser.tagProblemCounts.intermediate,
                fundamental: skillsRes.data.matchedUser.tagProblemCounts.fundamental
            } : null,
            languages: languagesRes?.data?.matchedUser?.languageProblemCount || [],
            recentSubmissions: submissionsRes?.data?.recentAcSubmissionList || [],
            contestHistory
        };

        return stats;
    }
}

export const leetCodeClient = new LeetCodeClient();
