import { Injectable } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, from, map, catchError, of, tap } from 'rxjs';
import { User } from './user.service';
import { User as Auth0User } from '@auth0/auth0-spa-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth0: Auth0Service) {}

  login(): Observable<void> {
    return from(this.auth0.loginWithRedirect({
      appState: { target: window.location.pathname }
    }));
  }

  logout(): Observable<void> {
    return from(this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    }));
  }

  isAuthenticated(): Observable<boolean> {
    return this.auth0.isAuthenticated$.pipe(
      tap(isAuth => console.log('Is authenticated:', isAuth))
    );
  }

  getUser(): Observable<User | null | undefined> {
    return this.auth0.user$.pipe(
      tap(user => console.log('Auth0 user:', user)),
      map((auth0User: Auth0User | null | undefined) => {
        if (!auth0User) return auth0User;
        return {
          id: auth0User.sub || '',
          email: auth0User.email || '',
          daily_suggestions_count: 0,
          last_suggestion_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }),
      catchError(error => {
        console.error('Error getting user:', error);
        return of(null);
      })
    );
  }

  getAccessToken(): Observable<string> {
    console.log('Getting access token...');
    return from(this.auth0.getAccessTokenSilently({
      authorizationParams: {
        audience: environment.auth0.authorizationParams.audience
      }
    })).pipe(
      tap(token => console.log('Got access token:', token ? `${token.substring(0, 10)}...` : 'none')),
      catchError(error => {
        console.error('Error getting access token:', error);
        return of('');
      })
    );
  }
}
