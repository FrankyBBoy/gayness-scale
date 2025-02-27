import { User } from './user.service';
import { Suggestion } from './suggestion.service';

const MAX_DAILY_VOTES = 10;
const K_FACTOR = 32; // ELO K-factor, determines how much ratings change
const DEFAULT_ELO = 1500; // Default ELO score for new suggestions

export interface Vote {
  id: number;
  winner_id: number;
  loser_id: number;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class VoteService {
  constructor(private db: D1Database) {}

  private async getSuggestionElo(suggestionId: number): Promise<number> {
    const result = await this.db
      .prepare('SELECT elo_score FROM suggestions WHERE id = ?')
      .bind(suggestionId)
      .first<{ elo_score: number }>();
    
    return result?.elo_score || DEFAULT_ELO;
  }

  private calculateEloChange(winnerElo: number, loserElo: number): { winnerChange: number; loserChange: number } {
    const expectedWinnerScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const change = Math.round(K_FACTOR * (1 - expectedWinnerScore));

    return {
      winnerChange: change,
      loserChange: -change
    };
  }

  private async updateEloScores(winnerId: number, loserId: number): Promise<void> {
    const winnerElo = await this.getSuggestionElo(winnerId);
    const loserElo = await this.getSuggestionElo(loserId);
    
    const { winnerChange, loserChange } = this.calculateEloChange(winnerElo, loserElo);

    // Update winner's ELO
    await this.db
      .prepare('UPDATE suggestions SET elo_score = ? WHERE id = ?')
      .bind(winnerElo + winnerChange, winnerId)
      .run();

    // Update loser's ELO
    await this.db
      .prepare('UPDATE suggestions SET elo_score = ? WHERE id = ?')
      .bind(loserElo + loserChange, loserId)
      .run();
  }

  async createVote(userId: string, winnerId: number, loserId: number): Promise<Vote> {
    // Check daily vote limit
    const today = new Date().toISOString().split('T')[0];
    const voteCount = await this.db
      .prepare('SELECT COUNT(*) as count FROM votes WHERE user_id = ? AND DATE(created_at) = ?')
      .bind(userId, today)
      .first<{ count: number }>();

    if (voteCount && voteCount.count >= MAX_DAILY_VOTES) {
      throw new Error('Daily vote limit reached');
    }

    // Start transaction
    const now = new Date().toISOString();
    
    try {
      // Create vote record
      const vote = await this.db
        .prepare(
          `INSERT INTO votes (winner_id, loser_id, user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           RETURNING *`
        )
        .bind(winnerId, loserId, userId, now, now)
        .first<Vote>();

      if (!vote) {
        throw new Error('Failed to create vote');
      }

      // Update ELO scores
      await this.updateEloScores(winnerId, loserId);

      return vote;
    } catch (error) {
      console.error('Error in createVote:', error);
      throw error;
    }
  }

  async getUserVotes(userId: string, page: number = 1, limit: number = 10): Promise<{ items: Vote[]; total: number }> {
    const offset = (page - 1) * limit;

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM votes WHERE user_id = ?')
      .bind(userId)
      .first<{ count: number }>();

    const votes = await this.db
      .prepare('SELECT * FROM votes WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(userId, limit, offset)
      .all<Vote>();

    return {
      items: votes.results,
      total: countResult?.count || 0
    };
  }

  async getVotesBySuggestion(suggestionId: number): Promise<Vote[]> {
    const result = await this.db
      .prepare('SELECT * FROM votes WHERE winner_id = ? OR loser_id = ? ORDER BY created_at DESC')
      .bind(suggestionId, suggestionId)
      .all<Vote>();

    return result.results;
  }
} 