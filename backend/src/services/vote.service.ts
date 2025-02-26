import { User } from './user.service';
import { Suggestion } from './suggestion.service';

const MAX_DAILY_VOTES = 10;
const K_FACTOR = 32; // ELO K-factor, determines how much ratings change

export interface Vote {
  id: number;
  suggestion_id: number;
  user_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export class VoteService {
  constructor(private db: D1Database) {}

  private calculateEloChange(score: number): number {
    // Convert 0-100 score to win probability (0.0 to 1.0)
    return score / 100;
  }

  private async updateEloScore(suggestionId: number, score: number): Promise<void> {
    const expectedScore = 0.5; // Expected score in ELO is 0.5 (50%)
    const actualScore = this.calculateEloChange(score);
    
    // Calculate ELO change
    const change = Math.round(K_FACTOR * (actualScore - expectedScore));

    // Update suggestion's ELO score
    await this.db
      .prepare(
        `UPDATE suggestions 
         SET elo_score = elo_score + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(change, suggestionId)
      .run();
  }

  private async checkAndUpdateDailyLimit(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];

    const user = await this.db
      .prepare(
        `SELECT daily_votes_count, last_vote_date
         FROM users 
         WHERE id = ?`
      )
      .bind(userId)
      .first<User>();

    if (!user) {
      throw new Error('User not found');
    }

    // Reset count if it's a new day
    if (user.last_vote_date !== today) {
      await this.db
        .prepare(
          `UPDATE users 
           SET daily_votes_count = 1,
               last_vote_date = ?
           WHERE id = ?`
        )
        .bind(today, userId)
        .run();
      return true;
    }

    // Check if user has reached daily limit
    if (user.daily_votes_count >= MAX_DAILY_VOTES) {
      return false;
    }

    // Increment vote count
    await this.db
      .prepare(
        `UPDATE users 
         SET daily_votes_count = daily_votes_count + 1
         WHERE id = ?`
      )
      .bind(userId)
      .run();

    return true;
  }

  async createVote(userId: string, suggestionId: number, score: number): Promise<Vote> {
    // Validate score range
    if (score < 0 || score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    // Check daily limit
    const canVote = await this.checkAndUpdateDailyLimit(userId);
    if (!canVote) {
      throw new Error('Daily vote limit reached');
    }

    // Start transaction
    const now = new Date().toISOString();
    
    // Create vote
    const vote = await this.db
      .prepare(
        `INSERT INTO votes (suggestion_id, user_id, score, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)
         RETURNING *`
      )
      .bind(suggestionId, userId, score, now, now)
      .first<Vote>();

    if (!vote) {
      throw new Error('Failed to create vote');
    }

    // Update suggestion's ELO score
    await this.updateEloScore(suggestionId, score);

    return vote;
  }

  async getUserVotes(userId: string, page = 1, pageSize = 10): Promise<{ votes: Vote[]; total: number }> {
    const offset = (page - 1) * pageSize;

    const [votes, countResult] = await Promise.all([
      this.db
        .prepare(
          `SELECT * FROM votes 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT ? OFFSET ?`
        )
        .bind(userId, pageSize, offset)
        .all<Vote>(),
      this.db
        .prepare('SELECT COUNT(*) as total FROM votes WHERE user_id = ?')
        .bind(userId)
        .first<{ total: number }>(),
    ]);

    return {
      votes: votes.results,
      total: countResult?.total || 0,
    };
  }

  async getVotesBySuggestion(suggestionId: number): Promise<Vote[]> {
    const result = await this.db
      .prepare('SELECT * FROM votes WHERE suggestion_id = ? ORDER BY created_at DESC')
      .bind(suggestionId)
      .all<Vote>();

    return result.results;
  }
} 