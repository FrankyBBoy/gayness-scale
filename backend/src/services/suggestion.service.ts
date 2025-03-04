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

    const suggestionsStmt = this.db.prepare(`
      SELECT id, description, user_id, elo_score, created_at, updated_at
      FROM suggestions
    `);
    
    const suggestionsResult = await suggestionsStmt.all<Suggestion>();
    const suggestions = suggestionsResult.results || [];
    
    if (suggestions.length < 2) {
      throw new Error("No more suggestions to vote on");
    }
    
    // 2. Récupérer les paires déjà votées par l'utilisateur
    const votedPairsStmt = this.db.prepare(`
      SELECT 
        CASE WHEN winner_id < loser_id THEN winner_id ELSE loser_id END AS suggestion1_id,
        CASE WHEN winner_id < loser_id THEN loser_id ELSE winner_id END AS suggestion2_id
      FROM votes
      WHERE user_id = ?
    `);
    
    const votedPairsResult = await votedPairsStmt.bind(userId).all<{suggestion1_id: string, suggestion2_id: string}>();
    const votedPairs = votedPairsResult.results || [];
    
    // Créer un Set pour une recherche rapide des paires déjà votées
    const votedPairsSet = new Set<string>();
    for (const pair of votedPairs) {
      votedPairsSet.add(`${pair.suggestion1_id}:${pair.suggestion2_id}`);
    }
    
    // 3. Générer toutes les paires possibles non votées
    const unvotedPairs: [Suggestion, Suggestion][] = [];
    
    for (let i = 0; i < suggestions.length; i++) {
      for (let j = i + 1; j < suggestions.length; j++) {
        const s1 = suggestions[i];
        const s2 = suggestions[j];
        
        // Vérifier si cette paire a déjà été votée
        const pairKey = s1.id < s2.id 
          ? `${s1.id}:${s2.id}` 
          : `${s2.id}:${s1.id}`;
        
        if (!votedPairsSet.has(pairKey)) {
          unvotedPairs.push([s1, s2]);
        }
      }
    }
    
    if (unvotedPairs.length === 0) {
      throw new Error("No more suggestions to vote on");
    }
    
    // 4. Sélectionner une paire aléatoire
    const randomIndex = Math.floor(Math.random() * unvotedPairs.length);
    const randomPair = unvotedPairs[randomIndex];
    
    // Convertir les dates en objets Date
    randomPair[0].created_at = new Date(randomPair[0].created_at as any);
    randomPair[0].updated_at = new Date(randomPair[0].updated_at as any);
    randomPair[1].created_at = new Date(randomPair[1].created_at as any);
    randomPair[1].updated_at = new Date(randomPair[1].updated_at as any);
    
    return { pair: randomPair };
  }
} 