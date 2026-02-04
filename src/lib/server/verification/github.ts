import { db } from '$lib/server/db';
import { account, platform_handles } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Check if user signed up with GitHub OAuth and auto-verify their GitHub handle.
 * If they have a GitHub OAuth account, we trust that as verification.
 */
export async function checkGitHubOAuthVerification(userId: string): Promise<{
  verified: boolean;
  username: string | null;
}> {
  // Check if user has a GitHub OAuth account linked via BetterAuth
  const [githubAccount] = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, 'github')));

  if (!githubAccount) {
    return { verified: false, username: null };
  }

  // accountId in BetterAuth for GitHub is the GitHub user ID
  // We need to fetch the username from GitHub API using the access token
  if (!githubAccount.accessToken) {
    return { verified: false, username: null };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${githubAccount.accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Dev-Compass'
      }
    });

    if (!res.ok) {
      console.error('GitHub API error:', res.status);
      return { verified: false, username: null };
    }

    const user = await res.json();
    return { verified: true, username: user.login };
  } catch (e) {
    console.error('GitHub verification error:', e);
    return { verified: false, username: null };
  }
}

/**
 * Auto-verify GitHub if user signed up with GitHub OAuth.
 * Creates or updates the platform_handles record.
 */
export async function autoVerifyGitHub(userId: string): Promise<boolean> {
  const { verified, username } = await checkGitHubOAuthVerification(userId);

  if (!verified || !username) {
    return false;
  }

  // Upsert the GitHub handle as verified
  await db
    .insert(platform_handles)
    .values({
      id: crypto.randomUUID(),
      userId,
      platform: 'github',
      handle: username,
      url: `https://github.com/${username}`,
      verifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: [platform_handles.userId, platform_handles.platform],
      set: {
        handle: username,
        url: `https://github.com/${username}`,
        verifiedAt: new Date(),
        verificationToken: null, // Clear any pending token
        updatedAt: new Date()
      }
    });

  return true;
}
