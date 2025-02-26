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

import { Router } from 'itty-router';
import { SuggestionService } from './services/suggestion.service';
import { createVoteRouter } from './routes/vote.routes';
import { createUserRouter } from './routes/user.routes';
import { authMiddleware } from './middleware/auth';
import { json, error } from './utils/response';

interface Env {
	DB: D1Database;
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

			// Create the main router
			const router = Router();

			// Root route
			router.get('/', () => json({ message: 'Gayness Scale API' }));

			// Public routes
			router.get('/api/suggestions', async (request: Request, env: Env) => {
				const url = new URL(request.url);
				const page = parseInt(url.searchParams.get('page') || '1');
				const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
				const status = url.searchParams.get('status') || undefined;

				const suggestionService = new SuggestionService(env.DB);
				const suggestions = await suggestionService.getSuggestions(page, pageSize, status);

				return json(suggestions);
			});

			// Protected routes middleware
			router.all('/api/*', async (request: Request, env: Env) => {
				const authResult = await authMiddleware(request);
				if (!authResult.isAuthenticated) {
					return error('Unauthorized', 401);
				}
				// Attach auth context to the request for downstream handlers
				(request as any).auth = authResult;
				return null; // Continue to next handler
			});

			// Mount sub-routers
			const voteRouter = createVoteRouter();
			const userRouter = createUserRouter();

			router.all('/api/votes/*', (request: Request, env: Env) => 
				voteRouter.handle(request, env, (request as any).auth)
			);

			router.all('/api/users/*', (request: Request, env: Env) => 
				userRouter.handle(request, env, (request as any).auth)
			);

			// 404 for unmatched routes
			router.all('*', () => error('Not Found', 404));

			// Handle the request
			const response = await router.handle(request, env);
			return response || error('Not Found', 404);
		} catch (e) {
			console.error('Error handling request:', e);
			return error('Internal Server Error', 500);
		}
	},
} satisfies ExportedHandler<Env>;
