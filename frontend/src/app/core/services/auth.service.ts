import { Injectable, OnDestroy } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { Observable, Subject } from 'rxjs';
import { map, tap, takeUntil, distinctUntilChanged, shareReplay, filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private isAuthenticated: Observable<boolean>;
  private userProfile: Observable<any>;

  constructor(
    private auth0: Auth0Service,
    private http: HttpClient
  ) {
    // Initialize streams
    this.isAuthenticated = this.auth0.isAuthenticated$.pipe(
      distinctUntilChanged(),
      tap(isAuthenticated => console.log('Auth service - Is authenticated:', isAuthenticated)),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    this.userProfile = this.auth0.user$.pipe(
      distinctUntilChanged(),
      tap(user => {
        console.log('Auth service - User profile:', user);
        if (user) {
          this.syncUserWithBackend(user);
        }
      }),
      shareReplay(1),
      takeUntil(this.destroy$)
    );

    // Subscribe to authentication errors
    this.auth0.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      error => console.error('Auth service - Error:', error)
    );
  }

  private syncUserWithBackend(user: any): void {
    if (!user) return;

    this.http.post(`${environment.api.serverUrl}/users/sync`, {
      id: user.sub,
      email: user.email,
      name: user.name
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => console.log('User synced with backend'),
      error: (error) => console.error('Error syncing user with backend:', error)
    });
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticated;
  }

  get user$() {
    return this.userProfile;
  }

  get userRole$(): Observable<string> {
    return this.user$.pipe(
      map(user => user?.['https://gayness-scale.app/role'] || 'standard')
    );
  }

  get dailyVotesCount$(): Observable<number> {
    return this.user$.pipe(
      map(user => user?.['https://gayness-scale.app/daily_votes_count'] || 0)
    );
  }

  get dailySuggestionsCount$(): Observable<number> {
    return this.user$.pipe(
      map(user => user?.['https://gayness-scale.app/daily_suggestions_count'] || 0)
    );
  }

  login(): void {
    console.log('Auth service - Starting login process');
    this.auth0.loginWithRedirect({
      appState: { target: window.location.pathname },
      authorizationParams: {
        scope: 'openid profile email'
      }
    });
  }

  logout(): void {
    this.auth0.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
