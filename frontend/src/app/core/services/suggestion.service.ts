import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Suggestion {
  id: number;
  title: string;
  description: string | null;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  elo_score: number;
  created_at: string;
  updated_at: string;
}

export interface PaginatedSuggestions {
  items: Suggestion[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateSuggestionData {
  title: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuggestionService {
  constructor(private api: ApiService) {}

  getSuggestions(page = 1, pageSize = 10, status?: string): Observable<PaginatedSuggestions> {
    return this.api.get<PaginatedSuggestions>('/api/suggestions', {
      page,
      pageSize,
      ...(status && { status })
    });
  }

  getSuggestionById(id: number): Observable<Suggestion> {
    return this.api.get<Suggestion>(`/api/suggestions/${id}`);
  }

  createSuggestion(data: CreateSuggestionData): Observable<Suggestion> {
    return this.api.post<Suggestion>('/api/suggestions', data);
  }

  updateSuggestionStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Observable<Suggestion> {
    return this.api.put<Suggestion>(`/api/suggestions/${id}/status`, { status });
  }
} 