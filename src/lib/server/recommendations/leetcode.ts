import { db } from "$lib/server/db";
import { problems } from "$lib/server/db/schema";
import type { LeetCodeDifficulty } from "$lib/types";
import { normalizeTag } from "$lib/utils/normalise";
import { and, eq, notInArray, sql, inArray } from "drizzle-orm";


export async function getLeetcodeProblemsScored(
  attemptedIds: string[],
  weakTags: string[]
) {
  const weakTagsArray = sql`ARRAY[${sql.join(
    weakTags.map(t => sql`${t}`),
    sql`, `
  )}]::text[]`;

  const scoreExpr = sql<number>`
(
  cardinality(
    ARRAY(
      SELECT unnest(${problems.tags})
      INTERSECT
      SELECT unnest(${weakTagsArray})
    )
  ) * 5
  +
  CASE
    WHEN ${problems.difficulty} = 'hard' THEN 2
    WHEN ${problems.difficulty} = 'medium' THEN 1
    ELSE 0
  END
)
`.as("score");


  // Ensure attemptedIds is not empty to avoid SQL errors
  const excludeCondition = attemptedIds.length > 0 
    ? notInArray(problems.slug, attemptedIds)
    : undefined;

  const topTwentySubquery = await db
    .select({
      id: problems.id,
      title: problems.title,
      slug: problems.slug,
      url: problems.url,
      difficulty: problems.difficulty,
      rating: problems.rating,
      tags: problems.tags,
      score: scoreExpr,
    })
    .from(problems)
    .where(
      and(
        eq(problems.platform, "leetcode"),
        excludeCondition
      )
    )
    .orderBy(sql`score DESC`, sql`RANDOM()`) // Add randomness to break ties and shuffle top results
    .limit(20)
    .as("top_twenty");

    const randomThree = await db
    .select()
    .from(topTwentySubquery)
    .orderBy(sql`RANDOM()`) // Shuffle only the top 20
    .limit(3);

    return randomThree;
}


