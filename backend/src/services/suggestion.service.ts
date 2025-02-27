import { Suggestion, CreateSuggestionDTO, UpdateSuggestionDTO } from '../models/suggestion.model';

export class SuggestionService {
  constructor(private db: D1Database) {}

  async create(data: CreateSuggestionDTO): Promise<Suggestion> {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare(
        `INSERT INTO suggestions (description, user_id, created_at, updated_at)
         VALUES (?, ?, ?, ?)
         RETURNING *`
      )
      .bind(data.description, data.user_id, now, now)
      .first<Suggestion>();

    if (!result) {
      throw new Error('Failed to create suggestion');
    }

    return result;
  }

  async findAll(page: number = 1, limit: number = 10): Promise<{ items: Suggestion[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM suggestions')
      .first<{ count: number }>();

    const suggestions = await this.db
      .prepare('SELECT * FROM suggestions ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(limit, offset)
      .all<Suggestion>();

    return {
      items: suggestions.results,
      total: countResult?.count || 0
    };
  }

  async findById(id: number): Promise<Suggestion | null> {
    return await this.db
      .prepare('SELECT * FROM suggestions WHERE id = ?')
      .bind(id)
      .first<Suggestion>();
  }

  async update(id: number, data: UpdateSuggestionDTO): Promise<Suggestion | null> {
    const now = new Date().toISOString();
    return await this.db
      .prepare(
        `UPDATE suggestions 
         SET description = ?, updated_at = ?
         WHERE id = ?
         RETURNING *`
      )
      .bind(data.description, now, id)
      .first<Suggestion>();
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM suggestions WHERE id = ?')
      .bind(id)
      .run();
    
    return result.success;
  }

  async findByUserId(userId: string, page: number = 1, limit: number = 10): Promise<{ items: Suggestion[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM suggestions WHERE user_id = ?')
      .bind(userId)
      .first<{ count: number }>();

    const suggestions = await this.db
      .prepare('SELECT * FROM suggestions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(userId, limit, offset)
      .all<Suggestion>();

    return {
      items: suggestions.results,
      total: countResult?.count || 0
    };
  }

  async getRandomPairForVoting(userId: string): Promise<{ pair: Suggestion[]; remainingCount: number }> {
    // Get suggestions not voted by the user (either as winner or loser)
    const result = await this.db
      .prepare(`
        SELECT s.* 
        FROM suggestions s
        WHERE s.id NOT IN (
          SELECT winner_id FROM votes WHERE user_id = ?
          UNION
          SELECT loser_id FROM votes WHERE user_id = ?
        )
        ORDER BY RANDOM()
        LIMIT 2
      `)
      .bind(userId, userId)
      .all<Suggestion>();

    // Get total count of remaining suggestions to vote on
    const countResult = await this.db
      .prepare(`
        SELECT COUNT(*) as count 
        FROM suggestions s
        WHERE s.id NOT IN (
          SELECT winner_id FROM votes WHERE user_id = ?
          UNION
          SELECT loser_id FROM votes WHERE user_id = ?
        )
      `)
      .bind(userId, userId)
      .first<{ count: number }>();

    return {
      pair: result.results,
      remainingCount: countResult?.count || 0
    };
  }
} 