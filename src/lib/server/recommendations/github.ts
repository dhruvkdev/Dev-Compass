import { db } from "$lib/server/db";
import { github_profile_snapshots, github_analysis, github_recommendations, github_task_templates } from '$lib/server/db/schema';
import { getGithubStatsCached } from '$lib/server/cache/github';
import { desc, eq } from 'drizzle-orm';
import type { GithubAnalysis, GithubRecommendation, GithubRecommendationRule } from "$lib/types";

async function normalizeGithubStats(username: string) {
	const stats = await getGithubStatsCached(username);
	if (!stats) return null;

    const activeRepos = stats.repositories.nodes.filter((r) => !r.isArchived);
    const totalCommits = stats.repositories.nodes.reduce(
        (acc, r) => acc + (r.defaultBranchRef?.target?.history?.totalCount ?? 0), 0
    );

    const langMap: Record<string, number> = {};
    for (const repo of stats.repositories.nodes) {
        for (const edge of repo.languages.edges) {
            langMap[edge.node.name] = (langMap[edge.node.name] ?? 0) + edge.size;
        }
    }

    const reposMetadata = activeRepos.map((repo) => {
        const primaryLang = repo.languages.edges.length > 0
            ? repo.languages.edges.reduce((max, edge) => edge.size > max.size ? edge : max).node.name
            : null;

        return {
            name: repo.name,
            createdAt: repo.createdAt.split('T')[0],
            stars: repo.stargazerCount,
            forks: repo.forkCount,
            primaryLanguage: primaryLang,
            commitCount: repo.defaultBranchRef?.target?.history?.totalCount ?? 0,
            isArchived: repo.isArchived,
        };
    });

    const activeDays = stats.contributionsCollection.contributionCalendar.weeks.reduce(
        (acc, week) => acc + week.contributionDays.filter((d) => d.contributionCount > 0).length, 0
    );

    const contributionStats = {
        totalContributions: stats.contributionsCollection.contributionCalendar.totalContributions,
        pullRequests: stats.contributionsCollection.pullRequestContributions.totalCount,
        issues: stats.contributionsCollection.issueContributions.totalCount,
        reviews: stats.contributionsCollection.pullRequestReviewContributions.totalCount,
        activeDays,
    };

    return {
        githubUsername: stats.login,
        repoCount: activeRepos.length,
        totalCommits,
        languages: langMap,
        reposMetadata,
        contributionStats,
    };
}

export async function ingestGithubSnapshot(userId: string, username: string) {
    const lastSnapshot = await db.query.github_profile_snapshots.findFirst({
        where: (t, { eq }) => eq(t.userId, userId),
        orderBy: (t, { desc }) => desc(t.createdAt),
    });

    if (lastSnapshot && Date.now() - lastSnapshot.createdAt.getTime() < 24 * 60 * 60 * 1000) {
        return lastSnapshot;
    }

    const snapshot = await normalizeGithubStats(username);
    if (!snapshot) return null;

    const [inserted] = await db
        .insert(github_profile_snapshots)
        .values({
            userId,
            githubUsername: snapshot.githubUsername,
            repoCount: snapshot.repoCount,
            totalCommits: snapshot.totalCommits,
            languages: snapshot.languages,
            reposMetadata: snapshot.reposMetadata,
            contributionStats: snapshot.contributionStats,
        })
        .returning();

    return inserted;
}

function deriveFocusFromLanguages(languages: Record<string, number>) {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  const focus: string[] = [];

  const pct = (lang: string) =>
    (languages[lang] ?? 0) / total;

  if (pct("TypeScript") + pct("JavaScript") > 0.4) focus.push("web_dev");
  if (pct("Python") > 0.3) focus.push("data_or_backend");
  if (pct("Go") + pct("Rust") + pct("C") > 0.25) focus.push("systems");
  if (pct("C++") > 0.3) focus.push("competitive_programming");

  return focus;
}


function deriveFocusFromRepos(repos: any[]) {
  const focus: string[] = [];

  if (repos.some(r => r.name.includes("api") || r.name.includes("backend"))) {
    focus.push("backend");
  }

  if (repos.some(r => r.name.includes("frontend") || r.name.includes("ui"))) {
    focus.push("frontend");
  }

  if (repos.some(r => r.stars > 20)) {
    focus.push("public_projects");
  }

  if (repos.filter(r => r.commitCount > 200).length >= 1) {
    focus.push("long_lived_projects");
  }

  return focus;
}

function deriveGaps(snapshot: any, axes: any) {
  const gaps: string[] = [];

  if (axes.collaboration === "low" && snapshot.repoCount > 3) {
    gaps.push("low_collaboration");
  }

  if (axes.projectDepth !== "high" && snapshot.repoCount > 5) {
    gaps.push("shallow_projects");
  }

  if (snapshot.reposMetadata.every((r:any) => r.stars === 0)) {
    gaps.push("low_visibility");
  }

  if (snapshot.contributionStats.reviews === 0 && snapshot.contributionStats.pullRequests > 10) {
    gaps.push("no_code_reviews");
  }

  return gaps;
}

function deriveStrengths(snapshot: any, axes: any) {
  const strengths: string[] = [];

  if (axes.consistency === "high") strengths.push("consistent_contributor");
  if (axes.projectDepth === "high") strengths.push("deep_project_ownership");
  if (snapshot.contributionStats.pullRequests > 20) strengths.push("active_collaborator");
  if (Object.keys(snapshot.languages).length >= 4) strengths.push("language_breadth");

  return strengths;
}


export async function analyzeGithubSnapshot(snapshot: any) {
    // Check if analysis already exists for this snapshot
    const existingAnalysis = await db.query.github_analysis.findFirst({
        where: (t, { eq }) => eq(t.snapshotId, snapshot.id),
    });

    if (existingAnalysis) {
        return existingAnalysis as unknown as GithubAnalysis;
    }

    const repoCount = snapshot.repoCount;
    const commits = snapshot.totalCommits;
    const activeDays = snapshot.contributionStats.activeDays;
    const repos = snapshot.reposMetadata;

    let persona = "Explorer";
    if (repoCount >= 5 && commits > 500) persona = "Builder";
    if (repos.some((r:any) => r.stars > 50)) persona = "Maintainer";

    let maturity = "Early";
    if (commits > 300) maturity = "Growing";
    if (commits > 1000 && activeDays > 150) maturity = "Established";

    const axes = {
        consistency: activeDays > 150 ? "high" : activeDays > 60 ? "medium" : "low",
        collaboration: snapshot.contributionStats.pullRequests > 20 ? "medium" : "low",
        projectDepth: repos.some((r:any) => r.commitCount > 300) ? "high" : "medium",
    };
    const focusAreas = Array.from(new Set([
        ...deriveFocusFromLanguages(snapshot.languages),
        ...deriveFocusFromRepos(snapshot.reposMetadata),
    ]));

    const gaps = deriveGaps(snapshot, axes);
    const strengths = deriveStrengths(snapshot, axes);
    const [inserted] = await db.insert(github_analysis).values({
        userId:snapshot.userId,
        snapshotId: snapshot.id,
        persona,
        maturity,
        axes,
        focusAreas,
        gaps,
        strengths
    }).returning();

    return inserted as unknown as GithubAnalysis;
}

export async function generateGithubRecommendations(analysis: GithubAnalysis) {
  const rules: GithubRecommendationRule[] = [
    {
      priority: 1,
      when: (a) => a.axes.consistency === "low",
      build: () => ({
        category: "reinforcement",
        axisTargeted: "consistency",
        title: "Build a steady contribution rhythm",
        description:
          "Try contributing a few times a week, even if changes are small. Sustainable consistency matters more than intensity.",
      }),
    },

    {
      priority: 1,
      when: (a) => a.gaps.includes("shallow_projects"),
      build: () => ({
        category: "depth",
        axisTargeted: "projectDepth",
        title: "Turn one repo into a v1-quality project",
        description:
          "Pick one repository and improve it end-to-end: README, setup steps, clear goals, and a small roadmap.",
      }),
    },

    {
      priority: 2,
      when: (a) => a.focusAreas.includes("web_dev") && a.axes.collaboration === "low",
      build: () => ({
        category: "micro_collaboration",
        axisTargeted: "collaboration",
        title: "Make a low-pressure open-source web contribution",
        description:
          "Find a web project you already use and open a small documentation PR or issue. You don’t need to write code to contribute.",
      }),
    },

    {
      priority: 3,
      when: (a) => a.axes.collaboration === "low",
      build: () => ({
        category: "micro_collaboration",
        axisTargeted: "collaboration",
        title: "Try a small collaborative contribution",
        description:
          "Open a minor issue, review a PR, or improve docs in a repo you follow. Collaboration grows with small steps.",
      }),
    },

    {
      priority: 3,
      when: (a) => a.gaps.includes("low_visibility"),
      build: () => ({
        category: "maintenance",
        axisTargeted: "visibility",
        title: "Make one project easier to discover",
        description:
          "Add a short description, tags, or a demo link to one repository so visitors immediately understand its purpose.",
      }),
    },

    {
      priority: 4,
      when: (a) => a.strengths.includes("consistent_contributor"),
      build: () => ({
        category: "reinforcement",
        axisTargeted: "consistency",
        title: "Protect your consistency streak",
        description:
          "Keep your current rhythm going. Even small, regular improvements compound over time.",
      }),
    },

    {
      priority: 4,
      when: (a) => a.strengths.includes("language_breadth"),
      build: () => ({
        category: "reinforcement",
        axisTargeted: "breadth",
        title: "Lean into your multi-language strength",
        description:
          "Write a short README or note explaining why you chose different languages for different problems.",
      }),
    },
  ];

  const triggered = rules
    .filter((rule) => rule.when(analysis))
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map((rule) => rule.build());

  const existing = await db.query.github_recommendations.findMany({
    where: (t, { eq, isNull }) =>
      eq(t.userId, analysis.userId),
  });

  const newRecommendations = triggered.filter(
    (r) =>
      !existing.some(
        (e) =>
          e.category === r.category &&
          e.axisTargeted === r.axisTargeted &&
          !e.completedAt &&
          !e.dismissedAt
      )
  );

  for (const rec of newRecommendations) {
    await db.insert(github_recommendations).values({
      userId: analysis.userId,
      analysisId: analysis.id,
      category: rec.category,
      axisTargeted: rec.axisTargeted,
      title: rec.title,
      description: rec.description,
    });
  }

  return triggered;
}

