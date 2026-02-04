# Verification Flows

## Overview

Verification proves that a user owns the external profile they are claiming. Verified accounts are marked in the `platform_handles` table with a `verifiedAt` timestamp.

All verification logic resides in `$lib/server/verification/`.

---

## 1. GitHub Verification

**Method: OAuth Trust**

Since users can sign in with GitHub via BetterAuth, we implicitly trust the GitHub account linked to their session.

### Flow

1. User clicks "Verify GitHub" in Settings.
2. System checks `account` table for a linked GitHub provider.
3. If linked:
   - Fetch verified GitHub username from BetterAuth/GitHub API.
   - Insert/Update `platform_handles` with verified status.
4. If not linked:
   - Prompt user to sign out and sign in with GitHub.

---

## 2. Codeforces Verification

**Method: Token in Profile (First Name)**

Codeforces API does not support bio updates easily, so we use the **First Name** field which is publicly exposed in the API.

### Flow

1. **Generate Token**:
   - User requests verification.
   - Server generates a random token: `DEVCOMPASS-CF-XXXX`.
   - Token is stored in DB `platform_handles.verificationToken`.
2. **User Action**:
   - User pastes token into their **Codeforces Settings -> Social -> First Name**.
3. **Verify**:
   - User clicks "Verify".
   - Server fetches profile: `https://codeforces.com/api/user.info?handles={handle}`.
   - Server checks if `firstName`, `lastName`, or `organization` fields contain the token.
   - **Match**: Mark verified ✅.
   - **No Match**: Return error ❌.

---

## 3. LeetCode Verification

**Method: Token in Profile (Bio/About)**

### Flow

1. **Generate Token**:
   - Server generates token: `DEVCOMPASS-VERIFY-LC-XXXX`.
   - Stored in DB `platform_handles.verificationToken`.
2. **User Action**:
   - User pastes token into **LeetCode Profile -> Edit -> About Me**.
3. **Verify**:
   - User clicks "Verify".
   - Server fetches profile via GraphQL (`matchedUser { profile { aboutMe } }`).
   - Server checks if `aboutMe` contains the token.
   - **Match**: Mark verified ✅.

---

## Database Schema

Verified accounts are stored in `platform_handles`:

| Column              | Type      | Description                        |
| ------------------- | --------- | ---------------------------------- |
| `userId`            | text      | Link to internal user              |
| `platform`          | enum      | `github`, `codeforces`, `leetcode` |
| `handle`            | text      | External username                  |
| `verificationToken` | text      | The secret token (if pending)      |
| `verifiedAt`        | timestamp | If present, account is verified    |
