import { auth } from '$lib/server/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
    return auth.handler(request);
};

export const POST: RequestHandler = async ({ request }) => {
    return auth.handler(request);
};
