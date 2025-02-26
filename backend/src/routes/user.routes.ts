import { Router } from 'itty-router';
import { AuthContext } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { json } from '../utils/response';

interface Env {
  DB: D1Database;
}

export function createUserRouter() {
  const router = Router({ base: '/api/users' });
  
  // Get current user
  router.get('/', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userService = new UserService(env.DB);
    const user = await userService.getUserById(ctx.user.sub);

    if (!user) {
      return new Response('User not found', { status: 404 });
    }

    return json(user);
  });

  // Create or update user
  router.post('/', async (request: Request, env: Env, ctx: AuthContext) => {
    if (!ctx?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    try {
      const { name } = await request.json<{ name: string }>();
      
      if (!name) {
        return new Response('Name is required', { status: 400 });
      }

      const userService = new UserService(env.DB);
      const user = await userService.createOrUpdateUser(
        ctx.user.sub,
        ctx.user.email,
        name
      );

      return json(user);
    } catch (error) {
      console.error('Error creating/updating user:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  });

  return router;
} 