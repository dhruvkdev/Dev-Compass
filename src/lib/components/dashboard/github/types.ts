export enum Tier {
    Newbie = 'Newbie',
    Pupil = 'Pupil',
    Specialist = 'Specialist',
    Expert = 'Expert',
    CandidateMaster = 'Candidate Master',
    Master = 'Master',
    InternationalMaster = 'International Master',
    Grandmaster = 'Grandmaster',
    LegendaryGrandmaster = 'Legendary Grandmaster'
}

export interface ScoreBreakdown {
    label: string;
    score: number; // 0-100
    max: number;
    description: string;
}

export interface Rating {
    score: number; // 0-100 normalized
    tier: Tier;
    breakdown: ScoreBreakdown[];
}

export interface TimeSeriesData {
    date: Date;
    value: number;
    label?: string; // e.g. "3 PRs"
}

export interface AggregateMetrics {
    totalContributions: number;
    totalStars: number;
    totalForks: number;
    followers: number;
    pullRequests: number;
    issues: number;
    reviews: number;
}

export interface LanguageStats {
    name: string;
    size: number; // bytes
    color?: string;
    percentage: number;
}

export interface Repository {
    name: string;
    description: string | null;
    stars: number;
    forks: number;
    languages: string[];
    url?: string;
}

export interface GithubProfile {
    username: string;
    accountAgeYears: number;
    rating: Rating;
    activity: {
        heatmap: { date: string; value: number }[];
        timeline: TimeSeriesData[];
    };
    metrics: AggregateMetrics;
    skills: {
        languages: LanguageStats[];
        topLanguages: string[];
    };
    oss: {
        pinned: Repository[];
        breakdown: {
            prs: number;
            issues: number;
            reviews: number;
        };
    };
}
