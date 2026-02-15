import { rateLimitSchema } from "better-auth";
import { pgTable, text, integer, timestamp, boolean, uniqueIndex, pgEnum, uuid, jsonb, index, PgUUID } from "drizzle-orm/pg-core";

export const platformEnum = pgEnum('platform', ['leetcode', 'codeforces', 'codechef', 'github', 'geeksforgeeks', 'atcoder', 'hackerrank', 'hackerearth', 'cses', 'usaco']);
export const contextType = pgEnum('contextType', ['dsa_roadmap', 'cp_strategy', 'dev_suggestion', 'global_summary']);
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard']);
export const recommendationCategoryEnum = pgEnum('recommendation_category', ['reinforcement', 'depth', 'maintenance', 'micro_collaboration']);

export const user = pgTable("user", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull(),
	image: text("image"),
	goal: text("goal"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
});

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id)
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at")
});

export const platform_handles = pgTable("platform_handles", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	platform: platformEnum().notNull(),
	handle: text("handle").notNull(),
	url: text("url").notNull(),
	verificationToken: text("verification_token"),
	verifiedAt: timestamp("verified_at"),
	lastSyncedAt: timestamp("last_synced_at"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	uniqueIndex('user_id_platform_unique').on(table.userId, table.platform),
]);

export const daily_snapshots = pgTable("daily_snapshots", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	platform: platformEnum().notNull(),
	rawData: jsonb(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull()
}, (table) => [
	index('user_platform_date_idx').on(table.userId, table.platform, table.createdAt)
]);

export const ai_insights = pgTable("ai_insights", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	platform: platformEnum(),
	contextType: contextType().notNull(),
	insights: jsonb(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull().$onUpdate(() => new Date())
}, (table) => [
	uniqueIndex('user_id_context_type_unique').on(table.userId, table.contextType)
]);

export const problems = pgTable("problems", {
  id: uuid("id").defaultRandom().primaryKey(),

  platform: platformEnum().notNull(),
  externalId: text("external_id").notNull(), // VERY IMPORTANT

  title: text("title").notNull(),
  slug: text("slug").notNull(),
  url: text("url").notNull(),

  difficulty: difficultyEnum("difficulty"),
  rating: integer("rating"),

  tags: text("tags").array().notNull(),
  isPaid: boolean("is_paid").notNull().default(false),
  isNeetcode: boolean("is_neetcode").default(false),
  isStriver: boolean("is_striver").default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  is_active: boolean("is_active").notNull().default(true),
}, (table) => [
  uniqueIndex("platform_external_id_unique").on(table.platform, table.externalId)
]);

export const user_leetcode_solved_problems = pgTable("user_leetcode_solved_problems", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	problemSlug: text("problem_slug").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => [
	uniqueIndex('user_id_problem_slug_unique').on(table.userId, table.problemSlug)
]);


export const github_task_templates = pgTable("github_task_templates", {
	id: text("id").primaryKey(),
	title: text("title").notNull(),
	description: text("description").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow()	
});

export const user_recommended_problems = pgTable("user_recommended_problems", {
	id: text("id").primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	problemId: uuid("problem_id").notNull().references(() => problems.id),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow()
}, (table) => [
	uniqueIndex('user_id_problem_id_unique').on(table.userId, table.problemId)
]);

export const github_profile_snapshots = pgTable("github_profile_snapshots", {
	id: uuid("id").defaultRandom().primaryKey(),
	userId: text("user_id").notNull().references(() => user.id),
	githubUsername: text("github_username").notNull(),
	repoCount: integer("repo_count").notNull(),
	totalCommits: integer("total_commits").notNull(),
	languages: jsonb("languages").notNull(),
	reposMetadata: jsonb("repos_metadata").notNull(),
	contributionStats: jsonb("contribution_stats").notNull(),
	createdAt: timestamp("created_at").notNull().defaultNow()
},(t) => [
	index("github_snapshot_user_idx").on(t.userId),
	index("github_snapshot_created_idx").on(t.createdAt)
]);

export const github_analysis = pgTable(
  "github_analysis",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id),

    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => github_profile_snapshots.id),

    persona: text("persona").notNull(),
    maturity: text("maturity").notNull(),

    focusAreas: jsonb("focus_areas").notNull(),
    strengths: jsonb("strengths").notNull(),
    gaps: jsonb("gaps").notNull(),

    axes: jsonb("axes").notNull(), // descriptive, not numeric

    generatedAt: timestamp("generated_at").notNull().defaultNow(),
  },
  (t) => [
	uniqueIndex("github_analysis_snapshot_unique").on(t.userId, t.snapshotId),
	index("github_analysis_generated_idx").on(t.generatedAt)
  ]
);

export const github_recommendations = pgTable(
  "github_recommendations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id),

    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => github_analysis.id),

    category: text("category").notNull(), 
    // reinforcement | depth | maintenance | micro_collaboration

    title: text("title").notNull(),
    description: text("description").notNull(),
	dismissedAt: timestamp("dismissed_at"),
	completedAt: timestamp("completed_at"),

    axisTargeted: text("axis_targeted").notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
	index("github_reco_user_idx").on(t.userId),
	index("github_reco_analysis_idx").on(t.analysisId),
	index("github_reco_category_idx").on(t.category)
  ]
);
