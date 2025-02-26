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

const MAX_DAILY_SUGGESTIONS = 5;

export class SuggestionService {
  constructor(private db: D1Database) {}

  private async checkAndUpdateDailyLimit(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const user = await this.db
      .prepare(
        `SELECT daily_suggestions_count, last_suggestion_date
         FROM users 
         WHERE id = ?`
      )
      .bind(userId)
      .first<{ daily_suggestions_count: number; last_suggestion_date: string | null }>();

    if (!user) {
      throw new Error('User not found');
    }

    // Reset count if it's a new day
    if (user.last_suggestion_date !== today) {
      await this.db
        .prepare(
          `UPDATE users 
           SET daily_suggestions_count = 1,
               last_suggestion_date = ?
           WHERE id = ?`
        )
        .bind(today, userId)
        .run();
      return true;
    }

    // Check if user has reached daily limit
    if (user.daily_suggestions_count >= MAX_DAILY_SUGGESTIONS) {
      return false;
    }

    // Increment suggestion count
    await this.db
      .prepare(
        `UPDATE users 
         SET daily_suggestions_count = daily_suggestions_count + 1
         WHERE id = ?`
      )
      .bind(userId)
      .run();

    return true;
  }

  async createSuggestion(data: CreateSuggestionData): Promise<Suggestion> {
    // Check daily limit
    const canCreate = await this.checkAndUpdateDailyLimit(data.user_id);
    if (!canCreate) {
      throw new Error('Daily suggestion limit reached');
    }

    const now = new Date().toISOString();
    
    const result = await this.db
      .prepare(
        `INSERT INTO suggestions (title, description, user_id, status, elo_score, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', 1500, ?, ?)
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
    
    query += ' ORDER BY elo_score DESC LIMIT ? OFFSET ?';
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