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


  return await db
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
        notInArray(problems.externalId, attemptedIds)
      )
    )
    .orderBy(sql`score DESC`)
    .limit(3);
}


