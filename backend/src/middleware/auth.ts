import { createRemoteJWKSet, jwtVerify } from 'jose';

const ISSUER = 'https://dev-gayness-scale.eu.auth0.com/';
const AUDIENCE = 'https://api.gayness-scale.com';

const JWKS = createRemoteJWKSet(new URL(`${ISSUER}.well-known/jwks.json`));

export interface AuthContext {
  user: {
    sub: string;
    email: string;
  };
}

export async function authMiddleware(request: Request): Promise<AuthContext | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return {
      user: {
        sub: payload.sub as string,
        email: payload.email as string,
      },
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
} 