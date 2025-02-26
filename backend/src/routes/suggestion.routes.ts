import { Router, IRequest } from 'itty-router';
import { AuthContext } from '../middleware/auth';
import { SuggestionService } from '../services/suggestion.service';
import { json, error } from '../utils/response';

interface Env {
  DB: D1Database;
}

export function createSuggestionRouter() {
  const router = Router({ base: '/api/suggestions' });

  // Get paginated suggestions (public)
  router.get('/', async (request: Request, env: Env) => {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

      const suggestionService = new SuggestionService(env.DB);
      const suggestions = await suggestionService.findAll(page, pageSize);

      return json(suggestions);
    } catch (e) {
      console.error('Error getting suggestions:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Get suggestion by ID (public)
  router.get('/:id', async (request: IRequest, env: Env) => {
    try {
      const { id } = request.params;
      const suggestionId = parseInt(id);

      if (isNaN(suggestionId)) {
        return error('Invalid suggestion ID', 400);
      }

      const suggestionService = new SuggestionService(env.DB);
      const suggestion = await suggestionService.findById(suggestionId);

      if (!suggestion) {
        return error('Suggestion not found', 404);
      }

      return json(suggestion);
    } catch (e) {
      console.error('Error getting suggestion:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Create new suggestion (protected)
  router.post('/', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { description } = await request.json<{ description: string }>();

      if (!description) {
        return error('Description is required', 400);
      }

      const suggestionService = new SuggestionService(env.DB);
      
      try {
        const suggestion = await suggestionService.create({
          description,
          user_id: ctx.user.sub,
        });

        return json(suggestion, 201);
      } catch (e) {
        if (e instanceof Error && e.message === 'Daily suggestion limit reached') {
          return error('Daily suggestion limit reached', 429);
        }
        throw e;
      }
    } catch (e) {
      console.error('Error creating suggestion:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Update suggestion (protected)
  router.put('/:id', async (request: IRequest, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { id } = request.params;
      const suggestionId = parseInt(id);
      const { description } = await request.json<{ description: string }>();

      if (isNaN(suggestionId)) {
        return error('Invalid suggestion ID', 400);
      }

      if (!description) {
        return error('Description is required', 400);
      }

      const suggestionService = new SuggestionService(env.DB);
      const suggestion = await suggestionService.update(suggestionId, { description });

      if (!suggestion) {
        return error('Suggestion not found', 404);
      }

      return json(suggestion);
    } catch (e) {
      console.error('Error updating suggestion:', e);
      return error('Internal Server Error', 500);
    }
  });

  return router;
} 