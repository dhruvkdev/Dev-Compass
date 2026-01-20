import { json } from '@sveltejs/kit';
import { leetCodeClient } from '$lib/server/leetcode/client';

export async function GET({ url }) {
	const username = url.searchParams.get('username');
	if (!username) {
		return json({ error: 'Missing username' }, { status: 400 });
	}

	const stats = await leetCodeClient.fetchUser(username);

	if (!stats) {
		return json({ error: 'User not found' }, { status: 404 });
	}

	return json(stats);
}
