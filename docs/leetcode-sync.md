# LeetCode Synchronization & Recommendations

## Overview

Unlike Codeforces (which uses a public API for recent submissions), LeetCode requires a more involved process to synchronize a user's full submission history. This is necessary to generate accurate, personalized recommendations.

---

## 1. The Sync Flow

DevCompass uses an **Initial Import** strategy to bridge the gap between registration and historical data.

### Step 1: Verification

The user must first verify their LeetCode profile by placing a generated token in their "About Me" section on LeetCode.

### Step 2: Bulk Import (The "Browser Script")

Since LeetCode's public endpoints for submissions are limited, DevCompass provides a browser script (available in the `LeetCodeImportModal`) that users run in their LeetCode submissions page.

- The script extracts unique problem slugs from the "Submissions" table.
- The user pastes the resulting JSON into DevCompass.

### Step 3: API Process

The `/api/leetcode/bulk-import` endpoint:

1. Validates the user's session and verified status.
2. Batch-inserts unique slugs into the `user_leetcode_solved_problems` table.
3. Sets `is_synced = true` and updates `lastSyncedAt` in `platform_handles`.

---

## 2. Recommendation Engine

Personalized recommendations are generated on the dashboard using a weighted scoring algorithm.

### Scoring Logic

Recommendations are calculated in `getLeetcodeProblemsScored` (in `$lib/server/recommendations/leetcode.ts`):

1. **Tag Match (+5)**: Counts intersections between a user's identified weak tags and the problem's tags.
2. **Difficulty Weight**:
   - `Hard`: +2
   - `Medium`: +1
   - `Easy`: +0
3. **Solved Filtering**: Problems already present in `user_leetcode_solved_problems` are excluded.

### The "Top-20 Shuffle"

To avoid static results and provide variety:

1. The engine fetches the **Top 20** highest-scoring problems.
2. It then applies a secondary `ORDER BY RANDOM()` to select the **Top 3** shown to the user.
3. This ensures that every dashboard visit might suggest a different set of high-priority problems.

---

## 3. Database Schema

| Table                           | Purpose                                         |
| ------------------------------- | ----------------------------------------------- |
| `platform_handles`              | Stores `is_synced` status and `last_synced_at`. |
| `user_leetcode_solved_problems` | Stores all problem slugs solved by the user.    |
| `problems`                      | Global library of problems (scraped/ingested).  |
