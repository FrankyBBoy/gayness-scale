import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(AuthService);

  // Skip if not calling our API
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  // Skip if public endpoint (only GET /api/suggestions is public for listing)
  const isPublicEndpoint = req.url.startsWith(`${environment.apiUrl}/api/suggestions`) &&
                           !req.url.includes('/random-pair') &&
                           req.method === 'GET';

  if (isPublicEndpoint) {
    console.log('Public endpoint, skipping auth:', req.url);
    return next(req);
  }

  console.log('Intercepting request to:', req.url);
  
  // Add auth header
  return auth.getAccessToken().pipe(
    tap(token => console.log('Got token:', token ? 'yes (length: ' + token.length + ')' : 'no')),
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          headers: req.headers
            .set('Authorization', `Bearer ${token}`)
            .set('x-auth0-domain', environment.auth0.domain)
        });
        console.log('Added auth headers to request');
        return next(authReq);
      }
      console.log('No token available, sending request without auth');
      return next(req);
    })
  );
}; 