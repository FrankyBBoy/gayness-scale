import { Router } from 'itty-router';
import { AuthContext } from '../middleware/auth';
import { VoteService } from '../services/vote.service';
import { json, error } from '../utils/response';

interface Env {
  DB: D1Database;
}

export function createVoteRouter() {
  const router = Router({ base: '/api/votes' });

  // Create a new vote
  router.post('/', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { suggestion_id, score } = await request.json<{ suggestion_id: number; score: number }>();

      if (!suggestion_id || typeof score !== 'number') {
        return error('Invalid request body', 400);
      }

      const voteService = new VoteService(env.DB);
      
      try {
        const vote = await voteService.createVote(ctx.user.sub, suggestion_id, score);
        return json(vote, 201);
      } catch (e) {
        if (e instanceof Error && e.message === 'Daily vote limit reached') {
          return error('Daily vote limit reached', 429);
        }
        throw e;
      }
    } catch (e) {
      console.error('Error creating vote:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Get user's votes
  router.get('/user/:id', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { id } = request.params;
      
      // Users can only view their own votes
      if (id !== ctx.user.sub) {
        return error('Forbidden', 403);
      }

      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

      const voteService = new VoteService(env.DB);
      const votes = await voteService.getUserVotes(id, page, pageSize);

      return json(votes);
    } catch (e) {
      console.error('Error getting user votes:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Get votes for a suggestion
  router.get('/suggestion/:id', async (request: Request, env: Env) => {
    try {
      const { id } = request.params;
      const suggestionId = parseInt(id);

      if (isNaN(suggestionId)) {
        return error('Invalid suggestion ID', 400);
      }

      const voteService = new VoteService(env.DB);
      const votes = await voteService.getVotesBySuggestion(suggestionId);

      return json(votes);
    } catch (e) {
      console.error('Error getting suggestion votes:', e);
      return error('Internal Server Error', 500);
    }
  });

  return router;
} 