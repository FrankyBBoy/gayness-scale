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
import { createVoteRouter } from './routes/vote.routes';
import { createUserRouter } from './routes/user.routes';
import { createSuggestionRouter } from './routes/suggestion.routes';
import { authMiddleware } from './middleware/auth';
import { json, error } from './utils/response';

interface Env {
	DB: D1Database;
	AUTH0_DOMAIN: string;
	AUTH0_AUDIENCE: string;
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

			// Create sub-routers
			const voteRouter = createVoteRouter();
			const userRouter = createUserRouter();
			const suggestionRouter = createSuggestionRouter();

			// Protected routes middleware
			router.all('/api/*', async (request: Request, env: Env) => {
				// Skip auth only for GET /api/suggestions (but not /api/suggestions/random-pair)
				const url = new URL(request.url);
				// Public endpoint: GET /api/suggestions for listing
				if (request.method === 'GET' && (
					url.pathname === '/api/suggestions' || 
					(url.pathname.startsWith('/api/suggestions/') && 
					 !url.pathname.includes('/random-pair'))
				)) {
					return null;
				}

				const authResult = await authMiddleware(request, env);
				if (!authResult.isAuthenticated) {
					console.error('Authentication failed for:', url.pathname);
					return error('Unauthorized', 401);
				}
				// Attach auth context to the request for downstream handlers
				(request as any).auth = authResult;
				return null; // Continue to next handler
			});

			// Mount sub-routers
			router.all('/api/votes/*', (request: Request, env: Env) => {
				console.log("Handling votes route, auth:", (request as any).auth?.isAuthenticated);
				return voteRouter.handle(request, env, (request as any).auth);
			});

			router.all('/api/users/*', (request: Request, env: Env) => {
				console.log("Handling users route, auth:", (request as any).auth?.isAuthenticated);
				return userRouter.handle(request, env, (request as any).auth);
			});

			router.all('/api/suggestions*', (request: Request, env: Env) => {
				const url = new URL(request.url);
				console.log("Handling suggestions route:", url.pathname, "auth:", (request as any).auth?.isAuthenticated);
				return suggestionRouter.handle(request, env, (request as any).auth);
			});

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
