import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface User {
  id: string;
  email: string;
  name: string;
  daily_votes_count: number;
  daily_suggestions_count: number;
  last_vote_date: string | null;
  last_suggestion_date: string | null;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private api: ApiService) {}

  getCurrentUser(): Observable<User> {
    return this.api.get<User>('/api/users');
  }

  createOrUpdateUser(name: string): Observable<User> {
    return this.api.post<User>('/api/users', { name });
  }

  // Helper methods to check daily limits
  canVoteToday(user: User): boolean {
    const today = new Date().toISOString().split('T')[0];
    return user.last_vote_date !== today || user.daily_votes_count < 10;
  }

  canSuggestToday(user: User): boolean {
    const today = new Date().toISOString().split('T')[0];
    return user.last_suggestion_date !== today || user.daily_suggestions_count < 5;
  }

  getRemainingVotes(user: User): number {
    const today = new Date().toISOString().split('T')[0];
    if (user.last_vote_date !== today) {
      return 10;
    }
    return Math.max(0, 10 - user.daily_votes_count);
  }

  getRemainingSuggestions(user: User): number {
    const today = new Date().toISOString().split('T')[0];
    if (user.last_suggestion_date !== today) {
      return 5;
    }
    return Math.max(0, 5 - user.daily_suggestions_count);
  }
} 