import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserService } from './user.service';

export interface Suggestion {
  id: number;
  description: string;
  user_id: string;
  elo_score: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedSuggestions {
  items: Suggestion[];
  total: number;
  page: number;
  per_page: number;
}

export interface RandomPair {
  pair: Suggestion[];
  remainingCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionService {
  private apiUrl = `${environment.apiUrl}/api/suggestions`;

  constructor(
    private http: HttpClient,
    private userService: UserService
  ) {}

  createSuggestion(description: string): Observable<Suggestion> {
    return this.http.post<Suggestion>(this.apiUrl, { description })
      .pipe(
        tap(() => {
          // Refresh user data to update the remaining suggestions count
          this.userService.refreshUserData();
        })
      );
  }

  getSuggestions(page: number = 1, perPage: number = 10): Observable<PaginatedSuggestions> {
    const params = {
      page: page.toString(),
      per_page: perPage.toString()
    };
    return this.http.get<PaginatedSuggestions>(this.apiUrl, { params });
  }

  getLatestSuggestions(limit: number = 10): Observable<Suggestion[]> {
    const params = {
      page: '1',
      per_page: limit.toString(),
      sort_by: 'created_at',
      sort_order: 'desc'
    };
    
    return this.http.get<PaginatedSuggestions>(this.apiUrl, { params })
      .pipe(
        map(response => response.items)
      );
  }

  getUserSuggestions(userId: string, page: number = 1, perPage: number = 10): Observable<PaginatedSuggestions> {
    const params = {
      page: page.toString(),
      per_page: perPage.toString(),
      user_id: userId
    };
    return this.http.get<PaginatedSuggestions>(this.apiUrl, { params });
  }

  getSuggestionById(id: number): Observable<Suggestion> {
    return this.http.get<Suggestion>(`${this.apiUrl}/${id}`);
  }

  updateSuggestion(id: number, description: string): Observable<Suggestion> {
    return this.http.put<Suggestion>(`${this.apiUrl}/${id}`, { description });
  }

  deleteSuggestion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getRandomPair(): Observable<{ pair: [Suggestion, Suggestion]; remainingCount: number }> {
    console.log('Calling getRandomPair from service');
    
    // Temporary workaround - create mock data for testing
    if (false) { // Set to false to disable mock
      console.log('Using mock data for random pair');
      const mockSuggestions: [Suggestion, Suggestion] = [
        {
          id: 1,
          description: 'Using hand sanitizer',
          user_id: '123',
          elo_score: 1500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          description: 'Wearing a pink shirt',
          user_id: '456',
          elo_score: 1500,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      const mockResponse = {
        pair: mockSuggestions,
        remainingCount: 10
      };
      return of(mockResponse);
    }
    
    // Real implementation
    return this.http.get<{ pair: [Suggestion, Suggestion]; remainingCount: number }>(`${this.apiUrl}/random-pair`);
  }
} 