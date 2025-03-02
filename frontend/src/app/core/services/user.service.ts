import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap, BehaviorSubject, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { User as Auth0User } from '@auth0/auth0-spa-js';

export interface User {
  id: string;
  email: string;
  daily_votes_count: number;
  daily_suggestions_count: number;
  last_suggestion_date: string | null;
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
  private apiUrl = `${environment.api.serverUrl}/api/users`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

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
      switchMap(() => this.http.get<User>(this.apiUrl)),
      map(user => this.checkDailyLimits(user)),
      tap(user => this.currentUserSubject.next(user))
    );
  }

  refreshUserData(): Observable<User> {
    return this.http.get<User>(this.apiUrl).pipe(
      map(user => this.checkDailyLimits(user)),
      tap(user => this.currentUserSubject.next(user))
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`).pipe(
      map(user => this.checkDailyLimits(user))
    );
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
    const checkedUser = this.checkDailyLimits(user);
    return checkedUser.daily_suggestions_count < 5;
  }

  getRemainingVotes(user: User): number {
    return 10 - (user.daily_votes_count || 0);
  }

  getRemainingSuggestions(user: User): number {
    const checkedUser = this.checkDailyLimits(user);
    return 5 - (checkedUser.daily_suggestions_count || 0);
  }

  // Vérifie si la date de dernière suggestion est d'un jour différent
  // et réinitialise le compteur si nécessaire
  private checkDailyLimits(user: User): User {
    if (!user) return user;
    
    const today = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
    const lastSuggestionDate = user.last_suggestion_date ? 
      new Date(user.last_suggestion_date).toISOString().split('T')[0] : null;
    
    // Si la dernière suggestion date d'un jour différent ou est null,
    // on réinitialise le compteur
    if (lastSuggestionDate !== today) {
      console.log('Resetting daily suggestions count. Last date:', lastSuggestionDate, 'Today:', today);
      return {
        ...user,
        daily_suggestions_count: 0
      };
    }
    
    return user;
  }
} 