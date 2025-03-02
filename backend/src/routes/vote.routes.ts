import { Router, IRequest } from 'itty-router';
import { AuthContext } from '../middleware/auth';
import { VoteService } from '../services/vote.service';
import { json, error } from '../utils/response';
import { SuggestionService } from '../services/suggestion.service';
import { UserService } from '../services/user.service';

interface Env {
  DB: D1Database;
}

export function createVoteRouter() {
  const router = Router({ base: '/api/votes' });

  // Create vote (protected)
  router.post('/', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const body = await request.json() as { winner_id: number; loser_id: number };
      const { winner_id, loser_id } = body;

      if (!winner_id || !loser_id) {
        return error('Missing winner_id or loser_id', 400);
      }

      const suggestionService = new SuggestionService(env.DB);
      const userService = new UserService(env.DB);
      const voteService = new VoteService(env.DB, suggestionService, userService);

      const vote = await voteService.createVote(ctx.user.sub, winner_id, loser_id);
      return json(vote, 201);
    } catch (e) {
      console.error('Error creating vote:', e);
      
      if (e instanceof Error && e.message === 'Already voted on this pair') {
        return error('You have already voted on this pair', 400);
      } else if (e instanceof Error && e.message === 'Invalid suggestion IDs') {
        return error('Invalid suggestion IDs', 400);
      } else if (e instanceof Error && e.message === 'User not found') {
        return error('User not found', 404);
      } else {
        return error('Internal Server Error', 500);
      }
    }
  });

  // Get user votes (protected)
  router.get('/user/:id', async (request: IRequest, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { id } = request.params;
      const page = parseInt(request.query?.page as string || '1');
      const limit = parseInt(request.query?.limit as string || '10');

      const voteService = new VoteService(env.DB);
      const votes = await voteService.getUserVotes(id, page, limit);

      return json(votes);
    } catch (e) {
      console.error('Error getting user votes:', e);
      return error('Internal Server Error', 500);
    }
  });

  // Get votes for a suggestion
  router.get('/suggestion/:id', async (request: IRequest, env: Env) => {
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