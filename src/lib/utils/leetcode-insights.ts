import type { LeetCodeStats, SkillTag, RecentSubmission } from '$lib/server/leetcode/types';

// --- Types ---
export interface Insight {
    type: 'positive' | 'warning' | 'neutral' | 'critical';
    title: string;
    description: string;
    action?: string;
}

export interface SkillGap {
    tag: SkillTag;
    priority: 'high' | 'medium' | 'low';
    reason: string;
}

export interface CoachSummary {
    levelSummary: string;
    focusRecommendation: string;
    momentum: 'high' | 'consistent' | 'sporadic' | 'inactive';
    imbalance?: Insight;
}

// --- Constants ---
const RECENT_ACTIVITY_DAYS = 14;
const CONSISTENCY_THRESHOLD = 0.5; // active on 50% of days
const EASY_RATIO_WARNING = 0.6; // >60% easy is too much
const HARD_RATIO_TARGET = 0.1; // Target >10% hards for advanced

// --- Core Functions ---

/**
 * Generates a high-level coaching summary.
 */
export function getCoachSummary(stats: LeetCodeStats): CoachSummary {
    const { profile, recentSubmissions } = stats;

    // 1. Momentum Analysis
    const momentum = analyzeMomentum(recentSubmissions);

    // 2. Difficulty Balance
    const total = profile.totalSolved || 1;
    const easyRatio = profile.easySolved / total;
    const mediumRatio = profile.mediumSolved / total;
    const hardRatio = profile.hardSolved / total;

    let imbalance: Insight | undefined;
    let focusRecommendation = "Maintain your current practice routine.";
    let levelSummary = "You are building your coding profile.";

    // Simple Heuristic for "Level"
    if (total < 50) {
        levelSummary = "You are in the early stages of your preparation.";
        focusRecommendation = "Focus on solving more Easy problems to build syntax muscle memory.";
    } else if (easyRatio > EASY_RATIO_WARNING) {
        levelSummary = "You have a good grasp of basics, but might be staying in your comfort zone.";
        imbalance = {
            type: 'warning',
            title: 'Difficulty Imbalance',
            description: `Your solved problems are ${Math.round(easyRatio * 100)}% Easy.`,
            action: 'Shift focus to Medium problems to improve interview readiness.'
        };
        focusRecommendation = "Prioritize Medium difficulty problems daily.";
    } else if (mediumRatio > 0.5 && hardRatio < 0.05) {
        levelSummary = "You are solid on standard interview questions.";
        focusRecommendation = "Start sprinkling in Hard problems to push your limits.";
    } else if (hardRatio > HARD_RATIO_TARGET) {
        levelSummary = "You have an advanced profile suitable for top-tier tech interviews.";
        focusRecommendation = "Focus on contest performance and speed.";
    } else {
        levelSummary = "You have a balanced profile.";
    }

    return {
        levelSummary,
        focusRecommendation,
        momentum,
        imbalance
    };
}

/**
 * Analyzes consistency over the last 2 weeks
 */
function analyzeMomentum(submissions: RecentSubmission[]): CoachSummary['momentum'] {
    if (!submissions || submissions.length === 0) return 'inactive';

    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);

    // distinct days active
    const activeDays = new Set();
    let recentCount = 0;

    submissions.forEach(sub => {
        const date = new Date(parseInt(sub.timestamp) * 1000);
        if (date >= twoWeeksAgo) {
            recentCount++;
            activeDays.add(date.toDateString());
        }
    });

    const activeRatio = activeDays.size / RECENT_ACTIVITY_DAYS;

    if (activeRatio > 0.7) return 'high';
    if (activeRatio >= CONSISTENCY_THRESHOLD) return 'consistent';
    if (recentCount > 0) return 'sporadic';
    return 'inactive';
}

/**
 * Prioritizes skills based on ROI (Frequency in interviews vs Current Mastery)
 * Strategy:
 * 1. Gap: Fundamental skill with < 5 solves.
 * 2. ROI: Intermediate skill with < 15 solves (needs polish).
 * 3. Strength: High solve counts.
 */
export function prioritizeSkills(skills: LeetCodeStats['skills']) {
    if (!skills) return { strengths: [], gaps: [], roi: [] };

    // Flatten for easier analysis, preserving category
    const allSkills = [
        ...(skills.fundamental?.map(s => ({ ...s, category: 'Fund.', weight: 1 })) || []),
        ...(skills.intermediate?.map(s => ({ ...s, category: 'Inter.', weight: 2 })) || []),
        ...(skills.advanced?.map(s => ({ ...s, category: 'Adv.', weight: 3 })) || [])
    ];

    // Top Strengths (Highest solved count)
    const strengths = [...allSkills]
        .sort((a, b) => b.problemsSolved - a.problemsSolved)
        .slice(0, 5);

    // Critical Gaps (Fundamental topics with very low solves)
    const gaps = allSkills
        .filter(s => s.category === 'Fund.' && s.problemsSolved < 10)
        .sort((a, b) => a.problemsSolved - b.problemsSolved)
        .slice(0, 3);

    // High ROI (Intermediate topics that are often asked but not mastered)
    // "Mastered" approximate threshold = 30 solves
    const roi = allSkills
        .filter(s => s.category === 'Inter.' && s.problemsSolved < 30)
        .sort((a, b) => a.problemsSolved - b.problemsSolved) // Focus on least solved first
        .slice(0, 5);

    return { strengths, gaps, roi };
}
