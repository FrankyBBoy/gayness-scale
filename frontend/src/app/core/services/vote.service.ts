import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Vote {
  id: number;
  suggestion_id: number;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedVotes {
  votes: Vote[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  constructor(private api: ApiService) {}

  createVote(suggestion_id: number, score: number): Observable<Vote> {
    return this.api.post<Vote>('/api/votes', { suggestion_id, score });
  }

  getUserVotes(userId: string, page = 1, pageSize = 10): Observable<PaginatedVotes> {
    return this.api.get<PaginatedVotes>(`/api/votes/user/${userId}`, { page, pageSize });
  }

  getSuggestionVotes(suggestionId: number): Observable<Vote[]> {
    return this.api.get<Vote[]>(`/api/votes/suggestion/${suggestionId}`);
  }

  // Helper method to calculate average score
  calculateAverageScore(votes: Vote[]): number {
    if (!votes.length) return 0;
    const sum = votes.reduce((acc, vote) => acc + vote.score, 0);
    return Math.round(sum / votes.length);
  }
} 