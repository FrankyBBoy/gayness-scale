import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap, catchError } from 'rxjs';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth0 = inject(Auth0Service);

  // Only intercept requests to our API
  if (!req.url.startsWith(environment.api.serverUrl)) {
    return next(req);
  }

  console.log('Intercepting request to:', req.url);
  
  // First check if the user is authenticated
  return from(auth0.isAuthenticated$).pipe(
    switchMap(isAuthenticated => {
      if (!isAuthenticated) {
        console.log('User is not authenticated, skipping token fetch');
        return next(req);
      }

      console.log('User is authenticated, getting token...');
      return from(auth0.getAccessTokenSilently({
        authorizationParams: {
          audience: environment.auth0.authorizationParams.audience
        }
      })).pipe(
        switchMap(token => {
          console.log('Token received, adding to headers');
          const authReq = req.clone({
            headers: req.headers
              .set('Authorization', `Bearer ${token}`)
              .set('x-auth0-domain', environment.auth0.domain)
          });
          return next(authReq);
        }),
        catchError(error => {
          console.error('Error getting access token:', error);
          // En cas d'erreur, on continue sans token
          return next(req);
        })
      );
    }),
    catchError(error => {
      console.error('Error in auth interceptor:', error);
      return next(req);
    })
  );
}; 