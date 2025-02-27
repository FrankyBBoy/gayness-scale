import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { User as Auth0User } from '@auth0/auth0-spa-js';

export interface User {
  id: string;
  email: string;
  daily_votes_count: number;
  daily_suggestions_count: number;
  created_at: string;
  updated_at: string;
}

interface SyncUserData {
  id: string;
  email: string;
  name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/api/users`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  getCurrentUser(): Observable<User> {
    // Synchronise d'abord l'utilisateur avec le backend
    return this.authService.getUser().pipe(
      tap(auth0User => console.log('Auth0 user:', auth0User)),
      switchMap((auth0User: Auth0User | null | undefined) => {
        if (!auth0User) {
          throw new Error('User not authenticated');
        }
        const syncData = {
          id: auth0User['id'] || auth0User['sub'] || '',
          email: auth0User.email || '',
          name: auth0User.name || auth0User.email?.split('@')[0] || 'Anonymous User'
        };
        console.log('Syncing user with data:', syncData);
        return this.syncUser(syncData);
      }),
      tap(response => console.log('Sync response:', response)),
      switchMap(() => this.http.get<User>(this.apiUrl))
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  private syncUser(userData: SyncUserData): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/sync`, userData);
  }

  createOrUpdateUser(name: string): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/update`, { name });
  }

  canVote(user: User): boolean {
    return user.daily_votes_count < 10;
  }

  canSuggest(user: User): boolean {
    return user.daily_suggestions_count < 5;
  }

  getRemainingVotes(user: User): number {
    return 10 - (user.daily_votes_count || 0);
  }

  getRemainingSuggestions(user: User): number {
    return 5 - (user.daily_suggestions_count || 0);
  }
} 