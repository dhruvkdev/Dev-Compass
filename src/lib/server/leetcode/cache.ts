import type { LeetCodeStats } from './types';

interface CacheEntry {
    data: LeetCodeStats | null;
    timestamp: number;
}

const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 Hours
const MAX_CACHE_SIZE = 1000;

class LeetCodeCache {
    private memoryCache = new Map<string, CacheEntry>();

    // Redis hook - implement this if you have a Redis instance
    // private redis = new Redis(...)

    async get(username: string): Promise<LeetCodeStats | null | undefined> {
        const key = username.toLowerCase();

        // 1. Try Memory
        const entry = this.memoryCache.get(key);
        if (entry) {
            if (Date.now() - entry.timestamp < CACHE_TTL_MS) {
                return entry.data;
            } else {
                this.memoryCache.delete(key);
            }
        }

        // 2. Try Redis (Future Implementation)
        // const cached = await this.redis.get(`leetcode:${key}`);
        // if (cached) return JSON.parse(cached);

        return undefined;
    }

    async set(username: string, data: LeetCodeStats | null): Promise<void> {
        const key = username.toLowerCase();

        // Prune if full (Simple LRU approximation: just delete oldest if implementation needed, 
        // but for now simple size check is fine for Map which preserves insertion order)
        if (this.memoryCache.size >= MAX_CACHE_SIZE) {
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) this.memoryCache.delete(firstKey);
        }

        this.memoryCache.set(key, {
            data,
            timestamp: Date.now()
        });

        // await this.redis.set(`leetcode:${key}`, JSON.stringify(data), 'EX', 60 * 60 * 6);
    }
}

export const leetCodeCache = new LeetCodeCache();
