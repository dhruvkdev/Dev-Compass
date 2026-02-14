import { db } from "../src/lib/server/db";
import { problems } from "../src/lib/server/db/schema";
import { eq } from "drizzle-orm";
import { normalizeTag } from "../src/lib/utils/normalise";

async function normalizeLeetcodeTags() {
  console.log("🔍 Fetching LeetCode problems...");

  const rows = await db
    .select({
      id: problems.id,
      tags: problems.tags,
    })
    .from(problems)
    .where(eq(problems.platform, "leetcode"));

  console.log(`Found ${rows.length} problems`);

  // Batch updates instead of one-by-one to avoid 2900+ sequential queries
  const BATCH_SIZE = 100;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map((row) => {
        const normalized = row.tags.map(normalizeTag);
        return db
          .update(problems)
          .set({ tags: normalized })
          .where(eq(problems.id, row.id));
      })
    );

    console.log(`  Updated ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log("✅ Tag normalization complete");
  process.exit(0);
}

normalizeLeetcodeTags().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
