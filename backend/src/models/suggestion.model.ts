export interface Suggestion {
  id: number;
  description: string;
  user_id: string;
  elo_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateSuggestionDTO {
  description: string;
  user_id: string;
}

export interface UpdateSuggestionDTO {
  description?: string;
} 