import { Suggestion, CreateSuggestionDTO, UpdateSuggestionDTO } from '../models/suggestion.model';
import { UserService } from './user.service';

export class SuggestionService {
  private userService: UserService;

  constructor(private db: D1Database) {
    this.userService = new UserService(db);
  }

  async create(data: CreateSuggestionDTO): Promise<Suggestion> {
    // Check if user has reached daily limit
    const user = await this.userService.getUserById(data.user_id);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if it's a new day since last suggestion
    const today = new Date().toISOString().split('T')[0];
    const lastSuggestionDate = user.last_suggestion_date ? user.last_suggestion_date.split('T')[0] : null;

    // Reset count if it's a new day
    let dailyCount = user.daily_suggestions_count || 0;
    if (lastSuggestionDate !== today) {
      dailyCount = 0;
    }

    // Check if user has reached daily limit (5 suggestions per day)
    if (dailyCount >= 5) {
      throw new Error('Daily suggestion limit reached');
    }

    const now = new Date().toISOString();

    try {
      // First, insert the suggestion
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

      // Then, update user's daily suggestion count
      await this.db.prepare(`
        UPDATE users 
        SET daily_suggestions_count = ?, 
            last_suggestion_date = ?
        WHERE id = ?
      `).bind(dailyCount + 1, now, data.user_id).run();
      
      return result;
    } catch (error) {
      console.error('Error in suggestion creation:', error);
      throw error;
    }
  }

  async findAll(page: number = 1, limit: number = 10, sortBy: string = 'created_at', sortOrder: string = 'desc'): Promise<{ items: Suggestion[]; total: number }> {
    const offset = (page - 1) * limit;

    // Validate sort parameters to prevent SQL injection
    const validSortColumns = ['id', 'description', 'elo_score', 'created_at', 'updated_at'];
    const validSortOrders = ['asc', 'desc'];
    
    // Default to created_at if invalid sort column
    if (!validSortColumns.includes(sortBy)) {
      sortBy = 'created_at';
    }
    
    // Default to desc if invalid sort order
    if (!validSortOrders.includes(sortOrder.toLowerCase())) {
      sortOrder = 'desc';
    }

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM suggestions')
      .first<{ count: number }>();

    const suggestions = await this.db
      .prepare(`SELECT * FROM suggestions ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`)
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

    if (result.results.length < 2) {
      throw new Error('No more suggestions to vote on');
    }

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
      pair: [result.results[0], result.results[1]],
      remainingCount: countResult?.count || 0
    };
  }
} 