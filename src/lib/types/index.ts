
import type { LeetCodeStats } from '$lib/server/leetcode/types';
import type { GithubStats } from '$lib/server/github/types';

export type RecommendedProblem = {
    id: string;
    title: string;
    slug: string;
    url: string;
    difficulty: 'easy' | 'medium' | 'hard' | null;
    rating: number | null;
    tags: string[];
    score: number;
    platform: 'codeforces' | 'leetcode' | 'github';
};

export type CodeforcesDashboardData = {
    info: any;
    rating: any[];
    submissions: any[];
    weakTags: { tag: string; failed: number; total: number; rate: number }[];
    cfProblemsByRating: RecommendedProblem[];
};

export type LeetCodeDifficulty = "easy" | "medium" | "hard";

export type PlatformData = 
    | { platform: 'github'; handle: string; data: GithubStats }
    | { platform: 'codeforces'; handle: string; data: CodeforcesDashboardData }
    | { platform: 'leetcode'; handle: string; data: LeetCodeStats; recommendedProblems: RecommendedProblem[] };
