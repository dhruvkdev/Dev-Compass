import { db } from '$lib/server/db';
import { platform_handles } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export function generateVerificationToken(userId: string): string {
    // Generate a simple, recognizable token
    const suffix = crypto.randomUUID().split('-')[0];
    return `devcompass(${suffix})`;
}

export async function verifyProfile(platform: string, handle: string, token: string): Promise<boolean> {
    try {
        if (platform === 'leetcode') {
            return await verifyLeetCode(handle, token);
        } else if (platform === 'codeforces') {
            return await verifyCodeforces(handle, token);
        } else if (platform === 'github') {
            return await verifyGitHub(handle, token);
        }
        // Add other platforms as needed
        return false;
    } catch (e) {
        console.error(`Verification failed for ${platform}/${handle}:`, e);
        return false;
    }
}

// --- Platform Specific Verifiers ---

async function verifyLeetCode(username: string, token: string): Promise<boolean> {
    const query = `
        query userProfile($username: String!) {
            matchedUser(username: $username) {
                profile { aboutMe }
            }
        }
    `;
    const res = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { username } })
    });
    const data = await res.json();
    const aboutMe = data.data?.matchedUser?.profile?.aboutMe || "";
    return aboutMe.includes(token);
}

async function verifyCodeforces(handle: string, token: string): Promise<boolean> {
    // Codeforces API: user.info
    const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
    const data = await res.json();
    if (data.status === 'OK' && data.result.length > 0) {
        const user = data.result[0];
        // Check fields where user might put token:
        // firstName, lastName, organization (city is often restricted to list)
        // Note: CF doesn't have a generic "bio" in API. Users often change firstName for verification.
        // Or we can ask them to specific organization.
        // Let's check organization first, then name fields.
        const fieldsToCheck = [user.firstName, user.lastName, user.organization].filter(Boolean);
        return fieldsToCheck.some(field => field.includes(token));
    }
    return false;
}

async function verifyGitHub(username: string, token: string): Promise<boolean> {
    const res = await fetch(`https://api.github.com/users/${username}`);
    const user = await res.json();
    const bio = user.bio || "";
    return bio.includes(token);
}
