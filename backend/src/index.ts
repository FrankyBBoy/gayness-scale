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
import { createUserRouter } from './routes/user.routes';
import { createSuggestionRouter } from './routes/suggestion.routes';
import { createVoteRouter } from './routes/vote.routes';
import { authMiddleware } from './middleware/auth';
import { error } from './utils/response';

interface Env {
	DB: D1Database;
}

const router = Router();

// Add CORS preflight handler
router.options('*', () => new Response(null, {
	headers: {
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
	},
}));

// Mount user routes
router.all('/api/users/*', createUserRouter().handle);

// Mount suggestion routes
router.all('/api/suggestions/*', createSuggestionRouter().handle);

// Mount vote routes
router.all('/api/votes/*', createVoteRouter().handle);

// Default 404 handler
router.all('*', () => error('Not Found', 404));

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		try {
			// Add auth context to the request
			const authContext = await authMiddleware(request);
			
			return router.handle(request, env, authContext);
		} catch (e) {
			return error('Internal Server Error', 500);
		}
	},
} satisfies ExportedHandler<Env>;
