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
      const pageSize = parseInt(url.searchParams.get('per_page') || '10');
      const sortBy = url.searchParams.get('sort_by') || 'created_at';
      const sortOrder = url.searchParams.get('sort_order') || 'desc';
      const userId = url.searchParams.get('user_id');

      const suggestionService = new SuggestionService(env.DB);
      
      let suggestions;
      if (userId) {
        // Si user_id est présent, récupérer les suggestions de cet utilisateur
        suggestions = await suggestionService.findByUserId(userId, page, pageSize);
      } else {
        // Sinon, récupérer toutes les suggestions
        suggestions = await suggestionService.findAll(page, pageSize, sortBy, sortOrder);
      }

      return json(suggestions);
    } catch (e) {
      console.error('Error getting suggestions:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Get random pair for voting (protected)
  router.get('/random-pair', async (request: Request, env: Env, ctx: AuthContext) => {
    console.log("Random pair route called, auth context:", ctx);
    
    if (!ctx?.user) {
      console.error("No user in auth context, returning 401");
      return error('Unauthorized', 401);
    }

    try {
      console.log("Getting random pair for user:", ctx.user.sub);
      const suggestionService = new SuggestionService(env.DB);
      const result = await suggestionService.getRandomPairForVoting(ctx.user.sub);

      if (result.pair.length < 2) {
        console.log("Not enough suggestions available for voting");
        return error('Not enough suggestions available for voting', 404);
      }

      console.log(`Random pair found: ${result.pair.length} suggestions, remaining: ${result.remainingCount}`);
      return json(result);
    } catch (e) {
      console.error('Error getting random pair:', e);
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