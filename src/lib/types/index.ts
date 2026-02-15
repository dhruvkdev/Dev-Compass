
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
    | { platform: 'github'; handle: string; data: GithubStats; githubRecommendations: GithubRecommendation[] }
    | { platform: 'codeforces'; handle: string; data: CodeforcesDashboardData }
    | { platform: 'leetcode'; handle: string; data: LeetCodeStats; recommendedProblems: RecommendedProblem[] };

export type GithubAnalysis = {
    persona: string;
    maturity: string;
    userId: string;
    id: string;
    axes: {
        consistency: string;
        collaboration: string;
        projectDepth: string;
    };
    focusAreas: string[];
    gaps: string[];
    strengths: string[];
};

export type GithubRecommendation = {
  category: "reinforcement" | "depth" | "maintenance" | "micro_collaboration";
  axisTargeted: string;
  title: string;
  description: string;
};

export type GithubRecommendationRule = {
  priority: number; // lower = more important
  when: (a: GithubAnalysis) => boolean;
  build: () => GithubRecommendation;
};
