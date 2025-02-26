import { Router } from 'itty-router';
import { AuthContext } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { json, error } from '../utils/response';

interface Env {
  DB: D1Database;
}

export function createUserRouter() {
  const router = Router();
  
  // Get current user
  router.get('/api/users', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    const userService = new UserService(env.DB);
    const user = await userService.getUserById(ctx.user.sub);

    if (!user) {
      return error('User not found', 404);
    }

    return json(user);
  });

  // Sync user from Auth0
  router.post('/api/users/sync', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { id, email, name } = await request.json<{ id: string; email: string; name: string }>();
      
      if (!id || !email || !name) {
        return error('Id, email and name are required', 400);
      }

      // Verify that the authenticated user is syncing their own data
      if (id !== ctx.user.sub) {
        return error('Unauthorized: Cannot sync data for another user', 403);
      }

      const userService = new UserService(env.DB);
      const user = await userService.createOrUpdateUser(id, email, name);

      return json(user);
    } catch (err) {
      console.error('Error syncing user:', err);
      return error('Internal Server Error', 500);
    }
  });

  // Create or update user
  router.post('/api/users', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return error('Unauthorized', 401);
    }

    try {
      const { name } = await request.json<{ name: string }>();
      
      if (!name) {
        return error('Name is required', 400);
      }

      const userService = new UserService(env.DB);
      const user = await userService.createOrUpdateUser(
        ctx.user.sub,
        ctx.user.email,
        name
      );

      return json(user);
    } catch (err) {
      console.error('Error creating/updating user:', err);
      return error('Internal Server Error', 500);
    }
  });

  return router;
} 