import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Vote {
  id: number;
  winner_id: number;
  loser_id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedVotes {
  items: Vote[];
  total: number;
  page: number;
  per_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class VoteService {
  private apiUrl = `${environment.apiUrl}/api/votes`;

  constructor(private http: HttpClient) {}

  createVote(winnerId: number, loserId: number): Observable<Vote> {
    return this.http.post<Vote>(this.apiUrl, {
      winner_id: winnerId,
      loser_id: loserId
    });
  }

  getUserVotes(userId: string, page: number = 1, perPage: number = 10): Observable<PaginatedVotes> {
    const params = {
      page: page.toString(),
      per_page: perPage.toString()
    };
    return this.http.get<PaginatedVotes>(`${this.apiUrl}/user/${userId}`, { params });
  }

  getSuggestionVotes(suggestionId: number): Observable<Vote[]> {
    return this.http.get<Vote[]>(`${this.apiUrl}/suggestion/${suggestionId}`);
  }
} 