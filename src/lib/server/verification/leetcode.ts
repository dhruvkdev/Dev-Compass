/**
 * Generate a verification token for LeetCode bio verification.
 */
export function generateLeetCodeToken(): string {
  const suffix = crypto.randomUUID().split('-')[0].toUpperCase();
  return `DEVCOMPASS-VERIFY-LC-${suffix}`;
}

// Use same headers as the working LeetCode client
const LEETCODE_HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://leetcode.com',
  'Origin': 'https://leetcode.com'
};

/**
 * Verify LeetCode ownership by checking if the token exists in the user's
 * profile summary or aboutMe section.
 */
export async function verifyLeetCodeBio(
  username: string,
  token: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const query = `
      query userProfile($username: String!) {
        matchedUser(username: $username) {
          profile {
            aboutMe
          }
        }
      }
    `;

    const res = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: LEETCODE_HEADERS,
      body: JSON.stringify({ query, variables: { username } })
    });

    if (!res.ok) {
      console.error('LeetCode API response:', res.status, res.statusText);
      return { verified: false, error: `Failed to fetch LeetCode profile (${res.status})` };
    }

    const data = await res.json();

    if (data.errors) {
      console.error('LeetCode GraphQL errors:', data.errors);
      return { verified: false, error: 'LeetCode API error' };
    }

    const profile = data.data?.matchedUser?.profile;
    if (!profile) {
      return { verified: false, error: 'User not found on LeetCode' };
    }

    // Check aboutMe field (this is where users put their bio)
    const aboutMe = profile.aboutMe || '';

    console.log('LeetCode aboutMe:', aboutMe);
    console.log('Looking for token:', token);

    if (aboutMe.includes(token)) {
      return { verified: true };
    }

    return {
      verified: false,
      error: 'Token not found in LeetCode bio. Go to your LeetCode Profile → Edit Profile → About Me section, paste the token, and save.'
    };
  } catch (e) {
    console.error('LeetCode verification error:', e);
    return { verified: false, error: 'Network error while verifying' };
  }
}

