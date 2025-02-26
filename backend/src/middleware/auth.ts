import { createRemoteJWKSet, jwtVerify } from 'jose';

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

export async function authMiddleware(request: Request): Promise<AuthContext> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { isAuthenticated: false };
    }

    const domain = request.headers.get('x-auth0-domain') || 'dev-7y1grk6neur7cepa.us.auth0.com';
    const JWKS = await getJWKS(domain);
    
    if (!JWKS) {
      console.error('Failed to create JWKS');
      return { isAuthenticated: false };
    }

    const token = authHeader.split(' ')[1];
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${domain}/`,
      audience: 'https://gayness-scale-backend/',
    });

    return {
      user: {
        sub: payload.sub as string,
        email: payload.email as string,
      },
      isAuthenticated: true
    };
  } catch (error) {
    console.error('Auth error:', error);
    return { isAuthenticated: false };
  }
} 