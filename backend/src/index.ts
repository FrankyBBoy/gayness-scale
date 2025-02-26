/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { SuggestionService } from './services/suggestion.service';
import { createVoteRouter } from './routes/vote.routes';
import { createUserRouter } from './routes/user.routes';
import { authMiddleware } from './middleware/auth';

interface Env {
	DB: D1Database;
}

function json(data: any, status = 200) {
	return new Response(JSON.stringify(data), {
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth0-domain',
		},
		status,
	});
}

function error(message: string, status = 500) {
	return json({ error: message }, status);
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			// Handle CORS preflight
			if (request.method === 'OPTIONS') {
				return new Response(null, {
					headers: {
						'Access-Control-Allow-Origin': '*',
						'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
						'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-auth0-domain',
					},
				});
			}

			const url = new URL(request.url);
			const path = url.pathname;

			// Root route
			if (path === '/') {
				return json({ message: 'Gayness Scale API' });
			}

			// Get suggestions (public)
			if (path === '/api/suggestions' && request.method === 'GET') {
				const page = parseInt(url.searchParams.get('page') || '1');
				const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
				const status = url.searchParams.get('status') || undefined;

				const suggestionService = new SuggestionService(env.DB);
				const suggestions = await suggestionService.getSuggestions(page, pageSize, status);

				return json(suggestions);
			}

			// Protected routes
			if (path.startsWith('/api/votes') || path.startsWith('/api/users')) {
				// Authenticate the request
				const authResult = await authMiddleware(request);
				if (!authResult.isAuthenticated) {
					return error('Unauthorized', 401);
				}

				// Handle votes routes
				if (path.startsWith('/api/votes')) {
					const voteRouter = createVoteRouter();
					const response = await voteRouter.handle(request, env, authResult);
					if (response) return response;
				}

				// Handle user routes
				if (path.startsWith('/api/users')) {
					const userRouter = createUserRouter();
					const response = await userRouter.handle(request, env, authResult);
					if (response) return response;
				}
			}

			// 404 for unmatched routes
			return error('Not Found', 404);
		} catch (e) {
			console.error('Error handling request:', e);
			return error('Internal Server Error', 500);
		}
	},
} satisfies ExportedHandler<Env>;
