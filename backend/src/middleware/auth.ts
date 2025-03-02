import { createRemoteJWKSet, jwtVerify } from 'jose';

// Interface pour l'environnement
interface Env {
  AUTH0_DOMAIN: string;
  AUTH0_AUDIENCE: string;
  [key: string]: any;
}

export interface AuthContext {
  user?: {
    sub: string;
    email: string;
  };
  isAuthenticated: boolean;
}

// Cache JWKS with expiration
let cachedJWKS: {
  jwks: ReturnType<typeof createRemoteJWKSet>;
  domain: string;
  expiration: number;
} | null = null;

const CACHE_DURATION = 3600000; // 1 hour in milliseconds

async function getJWKS(domain: string) {
  try {
    // Check if we have a valid cached JWKS
    if (
      cachedJWKS &&
      cachedJWKS.domain === domain &&
      Date.now() < cachedJWKS.expiration
    ) {
      return cachedJWKS.jwks;
    }

    // Create new JWKS
    const jwks = createRemoteJWKSet(new URL(`https://${domain}/.well-known/jwks.json`));

    // Cache the JWKS
    cachedJWKS = {
      jwks,
      domain,
      expiration: Date.now() + CACHE_DURATION
    };

    return jwks;
  } catch (error) {
    console.error('Error creating JWKS:', error);
    return null;
  }
}

export async function authMiddleware(request: Request, env: Env): Promise<AuthContext> {
  try {
    console.log("Auth middleware called for:", new URL(request.url).pathname);
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log("No valid Authorization header found");
      return { isAuthenticated: false };
    }

    const domain = request.headers.get('x-auth0-domain') || env.AUTH0_DOMAIN;
    console.log("Using Auth0 domain:", domain);
    
    const JWKS = await getJWKS(domain);
    
    if (!JWKS) {
      console.error('Failed to create JWKS');
      return { isAuthenticated: false };
    }

    const token = authHeader.split(' ')[1];
    console.log("Token found, length:", token.length);
    
    try {
      const { payload } = await jwtVerify(token, JWKS, {
        issuer: `https://${domain}/`,
        audience: env.AUTH0_AUDIENCE,
      });

      console.log("Token verified successfully for user:", payload.sub);
      return {
        user: {
          sub: payload.sub as string,
          email: payload.email as string,
        },
        isAuthenticated: true
      };
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return { isAuthenticated: false };
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return { isAuthenticated: false };
  }
} 