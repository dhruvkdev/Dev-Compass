import type { GithubStats } from '$lib/server/github/types';
import { Tier, type GithubProfile, type Rating, type ScoreBreakdown } from './types';

function calculateTier(score: number): Tier {
    if (score < 20) return Tier.Newbie;
    if (score < 40) return Tier.Pupil;
    if (score < 60) return Tier.Specialist;
    if (score < 80) return Tier.Expert;
    if (score < 120) return Tier.CandidateMaster; // Boosted for visible progression
    if (score < 160) return Tier.Master;
    if (score < 210) return Tier.InternationalMaster;
    if (score < 260) return Tier.Grandmaster;
    return Tier.LegendaryGrandmaster;
}

function calculateRating(stats: GithubStats): Rating {
    const consistency = Math.min(100, (stats.contributionsCollection.contributionCalendar.totalContributions / 365) * 5); // Approx 200 contribs = 100
    const impact = Math.min(100, stats.repositories.nodes.reduce((acc, repo) => acc + repo.stargazerCount, 0) / 2); // 200 stars = 100
    const oss = Math.min(100, stats.contributionsCollection.pullRequestContributions.totalCount * 5); // 20 PRs = 100

    const weightedScore = (0.3 * consistency) + (0.4 * impact) + (0.3 * oss);
    const normalizedScore = Math.floor(weightedScore * 2.5); // Scale to look like CF/LC rating somewhat? Or just 0-100? Let's do raw score first.
    // Actually user asked for "Rating = 0.3*Consistency + 0.4*Impact + 0.3*OSS"
    // Let's assume the resulting "Rating" is 0-100 based on the normalized sub-scores.

    const finalScore = Math.floor(weightedScore * 30); // 100 * 30 = 3000 max rating approx

    const breakdown: ScoreBreakdown[] = [
        { label: 'Consistency', score: Math.floor(consistency), max: 100, description: 'Active days & streak' },
        { label: 'Impact', score: Math.floor(impact), max: 100, description: 'Stars & Forks' },
        { label: 'OSS', score: Math.floor(oss), max: 100, description: 'PRs & Reviews' },
    ];

    return {
        score: finalScore,
        tier: calculateTier(finalScore / 10), // Scale down for tier brackets
        breakdown
    };
}

export function adaptGithubProfile(stats: GithubStats): GithubProfile {
    const createdAt = new Date(stats.createdAt);
    const now = new Date();
    const accountAgeYears = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

    // Metrics
    const metrics = {
        totalContributions: stats.contributionsCollection.contributionCalendar.totalContributions,
        totalStars: stats.repositories.nodes.reduce((acc, r) => acc + r.stargazerCount, 0),
        totalForks: stats.repositories.nodes.reduce((acc, r) => acc + r.forkCount, 0),
        followers: stats.followers.totalCount,
        pullRequests: stats.contributionsCollection.pullRequestContributions.totalCount,
        issues: stats.contributionsCollection.issueContributions.totalCount,
        reviews: stats.contributionsCollection.pullRequestReviewContributions.totalCount,
    };

    // Activity Heatmap
    const heatmap = stats.contributionsCollection.contributionCalendar.weeks
        .flatMap(week => week.contributionDays)
        .map(day => ({
            date: day.date,
            value: day.contributionCount
        }));

    // Timeline (Fake aggregation for now or derive from heatmap moving avg)
    // Actually we can map heatmap to timeline roughly
    const timeline = heatmap.map(d => ({
        date: new Date(d.date),
        value: d.value,
        label: `${d.value} contribs`
    }));

    // Skills (Languages)
    const languageMap = new Map<string, number>();
    stats.repositories.nodes.forEach(repo => {
        repo.languages.edges.forEach(edge => {
            const current = languageMap.get(edge.node.name) || 0;
            languageMap.set(edge.node.name, current + edge.size);
        });
    });

    const totalBytes = Array.from(languageMap.values()).reduce((a, b) => a + b, 0);
    const languages = Array.from(languageMap.entries())
        .map(([name, size]) => ({
            name,
            size,
            percentage: totalBytes > 0 ? (size / totalBytes) * 100 : 0
        }))
        .sort((a, b) => b.size - a.size)
        .slice(0, 6); // Top 6

    const rating = calculateRating(stats);

    return {
        username: stats.login,
        accountAgeYears: parseFloat(accountAgeYears.toFixed(1)),
        rating,
        activity: { heatmap, timeline },
        metrics,
        skills: {
            languages,
            topLanguages: languages.slice(0, 3).map(l => l.name)
        },
        oss: {
            pinned: stats.pinnedItems.nodes.map(node => ({
                name: node.name,
                description: node.description,
                stars: node.stargazerCount,
                forks: node.forkCount,
                languages: node.languages.nodes.map(l => l.name)
            })),
            breakdown: {
                prs: metrics.pullRequests,
                issues: metrics.issues,
                reviews: metrics.reviews
            }
        }
    };
}
