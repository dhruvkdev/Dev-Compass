import { db } from "../src/lib/server/db/client";
import { problems } from "../src/lib/server/db/schema";
import { sql } from "drizzle-orm";

// 1. Bulk Data (Using master branch which is often more stable for this repo)
const NEENZA_URL = "https://raw.githubusercontent.com/neenza/leetcode-problems/master/merged_problems.json";
// 2. NeetCode 150
const NEETCODE_URL = "https://raw.githubusercontent.com/krmanik/Anki-NeetCode/master/neetcode-150-list.json";
// 3. Striver SDE Sheet
const STRIVER_URL = "https://raw.githubusercontent.com/saviomartin/striver-sde-sheet/main/data/questions.json";

// Fallback API
const LEETCODE_API_URL = "https://leetcode.com/api/problems/algorithms/";

// --- HELPER: Automatically find the array inside an unknown JSON ---
function safeExtractArray(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (!data) return [];
  // Common wrappers
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.questions)) return data.questions;
  if (Array.isArray(data.sheet)) return data.sheet;
  // If it's an object with keys like "1": {}, "2": {} (Codeforces style), convert values to array
  if (typeof data === 'object') return Object.values(data);
  return [];
}

async function main() {
  console.log("🚀 Starting Unified LeetCode Ingest...");

  // --- Step A: Fetch Curated Lists ---
  console.log("Fetching curated lists...");
  const [neetRes, striverRes] = await Promise.all([
    fetch(NEETCODE_URL),
    fetch(STRIVER_URL)
  ]);

  // Log status to debug 404s
  if (!neetRes.ok) console.warn(`⚠️ NeetCode fetch failed: ${neetRes.status}`);
  if (!striverRes.ok) console.warn(`⚠️ Striver fetch failed: ${striverRes.status}`);

  const rawNeetData = neetRes.ok ? await neetRes.json() : [];
  const rawStriverData = striverRes.ok ? await striverRes.json() : [];

  // USE SAFE EXTRACT HERE
  const neetData = safeExtractArray(rawNeetData);
  const striverData = safeExtractArray(rawStriverData);

  console.log(`📦 Parsed Lists: ${neetData.length} NeetCode items, ${striverData.length} Striver items`);

  // --- Step B: Build Lookups ---
  const neetSet = new Set();
  neetData.forEach((p: any) => {
    // krmanik JSON sometimes uses 'Title' or 'problem' or just the string name
    const title = p.Title || p.problem || p.title || p; 
    if (typeof title === 'string') neetSet.add(title.trim());
  });

  const striverSet = new Set();
  // Striver data is often nested by Topic -> Questions
  striverData.forEach((topic: any) => {
    // If the top level is already a question (unlikely but possible)
    if (topic.url && topic.url.includes("leetcode")) {
       const slug = topic.url.split("/problems/")[1]?.replace(/\/$/, "");
       if (slug) striverSet.add(slug);
    }
    // If it's a topic object with a questions array
    if (Array.isArray(topic.questions)) {
       topic.questions.forEach((q: any) => {
          const slug = q.url?.split("/problems/")[1]?.replace(/\/$/, "");
          if (slug) striverSet.add(slug);
       });
    }
  });

  // --- Step C: Fetch Bulk Data (With Fallback) ---
  let allProblems = [];
  console.log("Fetching bulk questions from Neenza...");
  
  const neenzaRes = await fetch(NEENZA_URL);
  
  if (neenzaRes.ok) {
    const rawData = await neenzaRes.json();
    allProblems = safeExtractArray(rawData);
    console.log(`✅ Loaded ${allProblems.length} problems from GitHub.`);
  } else {
    console.warn(`⚠️ GitHub JSON failed (${neenzaRes.status}). Switching to LeetCode API...`);
    const apiRes = await fetch(LEETCODE_API_URL);
    if (!apiRes.ok) throw new Error(`LeetCode API also failed: ${apiRes.status}`);
    
    const data = await apiRes.json();
    // Transform API format
    allProblems = data.stat_status_pairs.map((p: any) => ({
      title: p.stat.question__title,
      problem_slug: p.stat.question__title_slug,
      problem_id: p.stat.question_id,
      difficulty: p.difficulty.level === 1 ? "Easy" : p.difficulty.level === 2 ? "Medium" : "Hard",
      is_paid: p.paid_only,
      topics: [] 
    }));
    console.log(`✅ Loaded ${allProblems.length} problems from LeetCode API.`);
  }

  // --- Step D: Batch Insert ---
  const batchSize = 500;
  let batch: any[] = [];

  for (const p of allProblems) {
    let diff = "medium";
    if (p.difficulty === "Easy") diff = "easy";
    if (p.difficulty === "Hard") diff = "hard";

    // Matching Logic
    const isNeetcode = neetSet.has(p.title);
    const isStriver = striverSet.has(p.problem_slug);

    batch.push({
      platform: "leetcode",
      externalId: p.problem_id.toString(),
      title: p.title,
      slug: p.problem_slug,
      url: `https://leetcode.com/problems/${p.problem_slug}/`,
      difficulty: diff,
      tags: p.topics || [], 
      isPaid: p.is_paid || false,
      isNeetcode: isNeetcode,
      isStriver: isStriver,
      is_active: true,
    });

    if (batch.length >= batchSize) {
      await upsertBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    await upsertBatch(batch);
  }

  console.log("✅ Ingestion Complete!");
}

async function upsertBatch(batch: any[]) {
  try {
    await db
      .insert(problems)
      .values(batch)
      .onConflictDoUpdate({
        target: [problems.platform, problems.externalId],
        set: {
          title: sql`excluded.title`,
          slug: sql`excluded.slug`,
          url: sql`excluded.url`,
          difficulty: sql`excluded.difficulty`,
          isPaid: sql`excluded.is_paid`,
          isNeetcode: sql`excluded.is_neetcode`,
          isStriver: sql`excluded.is_striver`,
          is_active: true,
          // Only update tags if new ones exist
          tags: sql`CASE WHEN array_length(excluded.tags, 1) > 0 THEN excluded.tags ELSE problems.tags END`,
        },
      });
      console.log(`Saved ${batch.length} problems...`);
  } catch (e) {
    console.error("Batch insert failed:", e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});