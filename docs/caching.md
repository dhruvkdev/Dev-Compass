# Caching Strategy

## Overview

DevCompass uses **Redis (Upstash)** to cache responses from third-party APIs (LeetCode, Codeforces, GitHub). This is critical to:

- Reduce latency (API calls can take 1-3s).
- Prevent hitting rate limits.
- Reduce bandwidth usage.

---

## Implementation

The caching logic is centralized in `$lib/server/cache/`.

### Core Helpers (`$lib/server/redis/helpers.ts`)

- **`getCache<T>(key)`**: Retreives and deserializes JSON data. Returns `null` on miss.
- **`setCache<T>(key, value, ttl)`**: Serializes and stores data with an expiration time.

### Key Structure

Keys are standardized in `$lib/server/redis/keys.ts` to avoid collisions.

| Platform   | Key Pattern             | TTL (Seconds) |
| ---------- | ----------------------- | ------------- |
| LeetCode   | `leetcode:{username}`   | 3600 (1h)     |
| Codeforces | `codeforces:{username}` | 3600 (1h)     |
| GitHub     | `github:{username}`     | 7200 (2h)     |

---

## Read/Write Flow

When data is requested (e.g., in `/dashboard`):

1. **Check Cache**:
   `const cached = await getCache(key);`
2. **If Hit**:
   Return `cached` immediately. **(Fast path)**

3. **If Miss**:
   - Call External API (`fetchLeetCodeStats`, etc.)
   - If API fails, return cached stale data (if supported) or error.
   - If User not found, cache "Not Found" state (optional) or do not cache.
   - **Store**: `await setCache(key, freshData, TTL);`
   - Return `freshData`.

---

## Code Example

```typescript
export async function getLeetCodeStatsCached(username: string) {
  const key = redisKeys.leetcode(username);

  // 1. Try Cache
  const cached = await getCache<LeetCodeStats>(key);
  if (cached) return cached;

  // 2. Fetch Fresh
  const fresh = await fetchLeetCodeStats(username);
  if (!fresh) return null;

  // 3. Store
  await setCache(key, fresh, 3600);

  return fresh;
}
```
