import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Suggestion {
  id: number;
  description: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedSuggestions {
  items: Suggestion[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionService {
  private apiUrl = `${environment.api.serverUrl}/api/suggestions`;

  constructor(private http: HttpClient) {}

  createSuggestion(description: string): Observable<Suggestion> {
    return this.http.post<Suggestion>(this.apiUrl, { description });
  }

  getSuggestions(page: number = 1, limit: number = 10): Observable<PaginatedSuggestions> {
    return this.http.get<PaginatedSuggestions>(`${this.apiUrl}?page=${page}&limit=${limit}`);
  }

  getUserSuggestions(userId: string, page: number = 1, limit: number = 10): Observable<PaginatedSuggestions> {
    return this.http.get<PaginatedSuggestions>(`${this.apiUrl}/user/${userId}?page=${page}&limit=${limit}`);
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
} 