import { Router } from 'itty-router';
import { AuthContext } from '../middleware/auth';
import { SuggestionService } from '../services/suggestion.service';
import { json, error } from '../utils/response';

interface Env {
  DB: D1Database;
}

export function createSuggestionRouter() {
  const router = Router({ base: '/api/suggestions' });

  // Get paginated suggestions
  router.get('/', async (request: Request, env: Env) => {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
      const status = url.searchParams.get('status') || undefined;

      const suggestionService = new SuggestionService(env.DB);
      const suggestions = await suggestionService.getSuggestions(page, pageSize, status);

      return json(suggestions);
    } catch (e) {
      console.error('Error getting suggestions:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Get suggestion by ID
  router.get('/:id', async (request: Request, env: Env) => {
    try {
      const { id } = request.params;
      const suggestionId = parseInt(id);

      if (isNaN(suggestionId)) {
        return error('Invalid suggestion ID', 400);
      }

      const suggestionService = new SuggestionService(env.DB);
      const suggestion = await suggestionService.getSuggestionById(suggestionId);

      if (!suggestion) {
        return error('Suggestion not found', 404);
      }

      return json(suggestion);
    } catch (e) {
      console.error('Error getting suggestion:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Create new suggestion
  router.post('/', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { title, description } = await request.json<{ title: string; description?: string }>();

      if (!title) {
        return error('Title is required', 400);
      }

      const suggestionService = new SuggestionService(env.DB);
      const suggestion = await suggestionService.createSuggestion({
        title,
        description,
        user_id: ctx.user.sub,
      });

      return json(suggestion, 201);
    } catch (e) {
      console.error('Error creating suggestion:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Update suggestion status (admin only)
  router.put('/:id/status', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { id } = request.params;
      const suggestionId = parseInt(id);
      const { status } = await request.json<{ status: 'pending' | 'approved' | 'rejected' }>();

      if (isNaN(suggestionId)) {
        return error('Invalid suggestion ID', 400);
      }

      if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
        return error('Invalid status', 400);
      }

      // TODO: Add admin check here
      const suggestionService = new SuggestionService(env.DB);
      const suggestion = await suggestionService.updateSuggestionStatus(suggestionId, status);

      if (!suggestion) {
        return error('Suggestion not found', 404);
      }

      return json(suggestion);
    } catch (e) {
      console.error('Error updating suggestion status:', e);
      return error('Internal Server Error', 500);
    }
  });

  return router;
} 