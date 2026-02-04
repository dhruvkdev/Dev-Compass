/**
 * Generate a Codeforces verification token.
 */
export function generateCodeforcesToken(): string {
  const suffix = crypto.randomUUID().split('-')[0].toUpperCase();
  return `DEVCOMPASS-CF-${suffix}`;
}

/**
 * Verify Codeforces ownership by checking if the token exists in the user's
 * firstName, lastName, or organization field.
 */
export async function verifyCodeforcesToken(
  handle: string,
  token: string
): Promise<{ verified: boolean; error?: string }> {
  try {
    const res = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      {
        headers: {
          'User-Agent': 'Dev-Compass'
        }
      }
    );

    if (!res.ok) {
      return { verified: false, error: 'Failed to fetch Codeforces profile' };
    }

    const data = await res.json();

    if (data.status !== 'OK' || !data.result || data.result.length === 0) {
      return { verified: false, error: 'User not found on Codeforces' };
    }

    const user = data.result[0];
    
    // Check firstName, lastName, and organization for the token
    const fieldsToCheck = [
      user.firstName || '',
      user.lastName || '',
      user.organization || ''
    ];
    
    const combinedText = fieldsToCheck.join(' ');
    
    if (combinedText.includes(token)) {
      return { verified: true };
    }

    return {
      verified: false,
      error: 'Token not found in Codeforces profile. Add the token to your First Name, Last Name, or Organization field and try again.'
    };
  } catch (e) {
    console.error('Codeforces verification error:', e);
    return { verified: false, error: 'Network error while verifying' };
  }
}
