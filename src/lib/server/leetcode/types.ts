export interface LeetCodeStats {
    profile: {
        username: string;
        ranking: number;
        totalSolved: number;
        easySolved: number;
        mediumSolved: number;
        hardSolved: number;
        totalQuestions: number;
        easyQuestions: number;
        mediumQuestions: number;
        hardQuestions: number;
    };
    skills: {
        advanced: SkillTag[];
        intermediate: SkillTag[];
        fundamental: SkillTag[];
    } | null;
    languages: LanguageStat[];
    recentSubmissions: RecentSubmission[];
}

export interface SkillTag {
    tagName: string;
    tagSlug: string;
    problemsSolved: number;
}

export interface LanguageStat {
    languageName: string;
    problemsSolved: number;
}

export interface RecentSubmission {
    title: string;
    titleSlug: string;
    timestamp: string; // Unix timestamp as string
    statusDisplay: string;
    lang: string;
}

// Internal GraphQL Response Types
export interface GQLUserProfileResponse {
    data: {
        allQuestionsCount: { difficulty: string; count: number }[];
        matchedUser: {
            username: string;
            profile: {
                ranking: number;
            };
            submitStats: {
                acSubmissionNum: { difficulty: string; count: number }[];
            };
        };
    };
}

export interface GQLSkillStatsResponse {
    data: {
        matchedUser: {
            tagProblemCounts: {
                advanced: SkillTag[];
                intermediate: SkillTag[];
                fundamental: SkillTag[];
            };
        };
    };
}

export interface GQLLanguageStatsResponse {
    data: {
        matchedUser: {
            languageProblemCount: LanguageStat[];
        };
    };
}

export interface GQLRecentSubmissionsResponse {
    data: {
        recentAcSubmissionList: {
            title: string;
            titleSlug: string;
            timestamp: string;
            statusDisplay: string;
            lang: string;
        }[];
    };
}
