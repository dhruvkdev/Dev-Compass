import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { user_leetcode_solved_problems, platform_handles } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id;

	// Verify the user has a verified LeetCode account
	const [leetcodeHandle] = await db
		.select()
		.from(platform_handles)
		.where(
			and(
				eq(platform_handles.userId, userId),
				eq(platform_handles.platform, 'leetcode')
			)
		);

	if (!leetcodeHandle || !leetcodeHandle.verifiedAt) {
		return json({ error: 'No verified LeetCode account found' }, { status: 403 });
	}

	// Parse and validate the request body
	let body: { slugs: string[] };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON body' }, { status: 400 });
	}

	if (!Array.isArray(body.slugs)) {
		return json({ error: 'Expected { slugs: string[] }' }, { status: 400 });
	}

	if (body.slugs.length > 5000) {
		return json({ error: 'Maximum 5000 slugs allowed per request' }, { status: 400 });
	}

	// Filter and validate slugs
	const validSlugs = body.slugs.filter(
		(s): s is string => typeof s === 'string' && s.length > 0 && s.length <= 100
	);

	if (validSlugs.length === 0) {
		return json({ error: 'No valid slugs provided' }, { status: 400 });
	}

	// Deduplicate
	const uniqueSlugs = [...new Set(validSlugs)];

	// Batch insert in chunks of 500
	const BATCH_SIZE = 500;
	let imported = 0;
	const now = new Date();

	for (let i = 0; i < uniqueSlugs.length; i += BATCH_SIZE) {
		const batch = uniqueSlugs.slice(i, i + BATCH_SIZE);
		const result = await db
			.insert(user_leetcode_solved_problems)
			.values(
				batch.map(slug => ({
					id: crypto.randomUUID(),
					userId,
					problemSlug: slug,
					createdAt: now,
					updatedAt: now
				}))
			)
			.onConflictDoNothing();

		// Count how many were actually inserted (not conflicting)
		imported += result.rowCount ?? batch.length;
	}

	// Update lastSyncedAt
	await db
		.update(platform_handles)
		.set({ lastSyncedAt: now, updatedAt: now })
		.where(
			and(
				eq(platform_handles.userId, userId),
				eq(platform_handles.platform, 'leetcode')
			)
		);

	console.log(`[Bulk Import] User ${userId}: imported ${imported} of ${uniqueSlugs.length} slugs`);

	return json({
		success: true,
		imported,
		total: uniqueSlugs.length
	});
};
