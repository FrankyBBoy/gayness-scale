export interface Suggestion {
  id: number;
  title: string;
  description: string | null;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface CreateSuggestionData {
  title: string;
  description?: string;
  user_id: string;
}

export interface PaginatedSuggestions {
  items: Suggestion[];
  total: number;
  page: number;
  pageSize: number;
}

export class SuggestionService {
  constructor(private db: D1Database) {}

  async createSuggestion(data: CreateSuggestionData): Promise<Suggestion> {
    const now = new Date().toISOString();
    
    const result = await this.db
      .prepare(
        `INSERT INTO suggestions (title, description, user_id, status, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', ?, ?)
         RETURNING *`
      )
      .bind(data.title, data.description || null, data.user_id, now, now)
      .first<Suggestion>();

    if (!result) {
      throw new Error('Failed to create suggestion');
    }

    return result;
  }

  async getSuggestionById(id: number): Promise<Suggestion | null> {
    return await this.db
      .prepare('SELECT * FROM suggestions WHERE id = ?')
      .bind(id)
      .first<Suggestion>();
  }

  async getSuggestions(page = 1, pageSize = 10, status?: string): Promise<PaginatedSuggestions> {
    const offset = (page - 1) * pageSize;
    
    let query = 'SELECT * FROM suggestions';
    let countQuery = 'SELECT COUNT(*) as total FROM suggestions';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = ?';
      countQuery += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const [items, countResult] = await Promise.all([
      this.db.prepare(query).bind(...params).all<Suggestion>(),
      this.db.prepare(countQuery).bind(...params.slice(0, -2)).first<{ total: number }>(),
    ]);

    return {
      items: items.results,
      total: countResult?.total || 0,
      page,
      pageSize,
    };
  }

  async updateSuggestionStatus(id: number, status: 'pending' | 'approved' | 'rejected'): Promise<Suggestion | null> {
    const now = new Date().toISOString();
    
    return await this.db
      .prepare(
        `UPDATE suggestions 
         SET status = ?, updated_at = ?
         WHERE id = ?
         RETURNING *`
      )
      .bind(status, now, id)
      .first<Suggestion>();
  }
} 