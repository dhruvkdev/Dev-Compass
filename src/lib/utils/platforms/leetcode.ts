import { db } from "$lib/server/db";
import { user_leetcode_solved_problems } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";

export function processLeetcodeWeakness(stats: any) {
  const weakTags: string[] = [];

  const collectWeak = (arr: any[], threshold: number) => {
    for (const tag of arr) {
      if (tag.problemsSolved < threshold) {
        weakTags.push(tag.tagSlug);
      }
    }
  };

  collectWeak(stats.skills.fundamental, 10);
  collectWeak(stats.skills.intermediate, 8);
  collectWeak(stats.skills.advanced, 5);

  return weakTags;
}

export async function getSolvedLeetcodeSlugs(userId: string) {
  const rows = await db
    .select({ slug: user_leetcode_solved_problems.problemSlug })
    .from(user_leetcode_solved_problems)
    .where(eq(user_leetcode_solved_problems.userId, userId));

  return rows.map(r => r.slug);
}

export type LeetcodeDifficulty = "easy" | "medium" | "hard";

export function getLeetcodeTargetDifficulties(
  stats: any
): LeetcodeDifficulty[] {
  if (stats.profile.totalSolved < 80) return ["easy", "medium"];
  if (stats.profile.totalSolved < 200) return ["medium", "hard"];
  return ["hard"];
}

