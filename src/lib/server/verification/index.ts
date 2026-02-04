// Barrel export for verification modules
export { checkGitHubOAuthVerification, autoVerifyGitHub } from './github';
export { generateCodeforcesToken, verifyCodeforcesToken } from './codeforces';
export { generateLeetCodeToken, verifyLeetCodeBio } from './leetcode';

// Legacy export for backwards compatibility with profile page
export function generateVerificationToken(userId: string): string {
  const suffix = crypto.randomUUID().split('-')[0];
  return `devcompass(${suffix})`;
}

/**
 * Legacy verifyProfile function for backwards compatibility with /profile page.
 * Checks if verification token is present in the platform's bio/profile field.
 */
export async function verifyProfile(platform: string, handle: string, token: string): Promise<boolean> {
  try {
    if (platform === 'leetcode') {
      const result = await import('./leetcode').then(m => m.verifyLeetCodeBio(handle, token));
      return result.verified;
    } else if (platform === 'codeforces') {
      // For Codeforces, check if token is in firstName/lastName/organization
      const res = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
      const data = await res.json();
      if (data.status === 'OK' && data.result.length > 0) {
        const user = data.result[0];
        const fieldsToCheck = [user.firstName, user.lastName, user.organization].filter(Boolean);
        return fieldsToCheck.some((field: string) => field.includes(token));
      }
      return false;
    } else if (platform === 'github') {
      // For GitHub, check if token is in bio
      const res = await fetch(`https://api.github.com/users/${handle}`);
      const user = await res.json();
      const bio = user.bio || '';
      return bio.includes(token);
    }
    return false;
  } catch (e) {
    console.error(`Verification failed for ${platform}/${handle}:`, e);
    return false;
  }
}
