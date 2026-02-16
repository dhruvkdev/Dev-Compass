import { db } from "../src/lib/server/db/client.js";
import { problems } from "../src/lib/server/db/schema.js";
import { eq, and, sql } from "drizzle-orm";

async function main() {
  console.log("Starting Codeforces ingestion...");

  const res = await fetch(
    "https://codeforces.com/api/problemset.problems"
  );
  const data = await res.json();

  if (data.status !== "OK") {
    throw new Error("CF API failed");
  }

  const { problems: cfProblems } = data.result;

  const batchSize = 500;
  let batch: any[] = [];

  for (const p of cfProblems) {
    if (!p.rating) continue;

    const externalId = `${p.contestId}-${p.index}`;

    batch.push({
      platform: "codeforces" as const,
      externalId,
      title: p.name,
      slug: externalId,
      url: `https://codeforces.com/problemset/problem/${p.contestId}/${p.index}`,
      rating: p.rating,
      difficulty:
        p.rating < 1200 ? "easy" as const :
        p.rating < 1800 ? "medium" as const :
        "hard" as const,
      tags: p.tags as string[],
    });

    if (batch.length === batchSize) {
      await db
        .insert(problems)
        .values(batch)
        .onConflictDoUpdate({
          target: [problems.platform, problems.externalId],
          set: {
            rating: sql`excluded.rating`,
            tags: sql`excluded.tags`,
            is_active: true,
          },
        });

      console.log(`Inserted ${batch.length} problems`);
      batch = [];
    }
  }

  // flush remaining
  if (batch.length > 0) {
    await db
      .insert(problems)
      .values(batch)
      .onConflictDoUpdate({
        target: [problems.platform, problems.externalId],
        set: {
          rating: sql`excluded.rating`,
          tags: sql`excluded.tags`,
          is_active: true,
        },
      });

    console.log(`Inserted final ${batch.length} problems`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
