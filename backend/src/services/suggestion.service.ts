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

  async getRandomPairForVoting(userId: string): Promise<{ pair: Suggestion[] }> {
    // Get a random pair of suggestions that the user hasn't voted on as a pair
    // Optimized query to reduce rows read by avoiding CROSS JOIN
    const result = await this.db
      .prepare(`
        WITH voted_pairs AS (
          SELECT 
            CASE WHEN winner_id < loser_id THEN winner_id ELSE loser_id END AS s1_id,
            CASE WHEN winner_id < loser_id THEN loser_id ELSE winner_id END AS s2_id
          FROM votes
          WHERE user_id = ?
        )
        SELECT 
          s1.id, s1.description, s1.user_id, s1.elo_score, s1.created_at, s1.updated_at,
          s2.id as id2, s2.description as description2, s2.user_id as user_id2, 
          s2.elo_score as elo_score2, s2.created_at as created_at2, s2.updated_at as updated_at2
        FROM suggestions s1
        JOIN suggestions s2 ON s1.id < s2.id
        LEFT JOIN voted_pairs vp ON vp.s1_id = s1.id AND vp.s2_id = s2.id
        WHERE vp.s1_id IS NULL
        ORDER BY RANDOM()
        LIMIT 1
      `)
      .bind(userId)
      .all();

    // If no unvoted pairs are found, throw an error
    if (!result.results || result.results.length === 0) {
      throw new Error('No more suggestions to vote on');
    }

    // Extract the two suggestions from the result
    const row = result.results[0];
    const suggestion1: Suggestion = {
      id: Number(row.id),
      description: String(row.description),
      user_id: String(row.user_id),
      elo_score: Number(row.elo_score),
      created_at: new Date(String(row.created_at)),
      updated_at: new Date(String(row.updated_at))
    };
    
    const suggestion2: Suggestion = {
      id: Number(row.id2),
      description: String(row.description2),
      user_id: String(row.user_id2),
      elo_score: Number(row.elo_score2),
      created_at: new Date(String(row.created_at2)),
      updated_at: new Date(String(row.updated_at2))
    };

    return {
      pair: [suggestion1, suggestion2]
    };
  }
} 