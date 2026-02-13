import { db } from "$lib/server/db";
import { problems } from "$lib/server/db/schema";
import { and, eq, gte, lte, notInArray, sql } from "drizzle-orm";

export async function getCodeforcesProblems() {
  const rows = await db
    .select()
    .from(problems)
    .where(eq(problems.platform, "codeforces"))
    .limit(5);

  return rows;
}
export async function getCodeforcesProblemsByRating(min: number, max: number, attemptedIds: string[], weakTags: string[]) {
  return await db
    .select()
    .from(problems)
    .where(
      and(
        eq(problems.platform, "codeforces"),
        gte(problems.rating, min),
        lte(problems.rating, max),
        notInArray(problems.externalId, attemptedIds),
        sql`${problems.tags} && ${sql.raw(`ARRAY[${weakTags.map(t => `'${t}'`).join(",")}]::text[]`)}`
      )
    )
    .limit(10);
}
