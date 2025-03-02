import { User, UserService } from './user.service';
import { SuggestionService } from './suggestion.service';
import { Suggestion } from '../models/suggestion.model';

const MAX_DAILY_VOTES = 10; // Cette constante n'est plus utilisée mais peut être conservée pour référence
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

export interface PaginatedVotes {
  items: Vote[];
  total: number;
}

export class VoteService {
  constructor(
    private db: D1Database,
    private suggestionService: SuggestionService,
    private userService: UserService
  ) {}

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

  private async updateEloScores(winner: Suggestion, loser: Suggestion): Promise<void> {
    const winnerElo = await this.getSuggestionElo(winner.id);
    const loserElo = await this.getSuggestionElo(loser.id);
    
    const { winnerChange, loserChange } = this.calculateEloChange(winnerElo, loserElo);

    // Update winner's ELO
    await this.db
      .prepare('UPDATE suggestions SET elo_score = ? WHERE id = ?')
      .bind(winnerElo + winnerChange, winner.id)
      .run();

    // Update loser's ELO
    await this.db
      .prepare('UPDATE suggestions SET elo_score = ? WHERE id = ?')
      .bind(loserElo + loserChange, loser.id)
      .run();
  }

  async createVote(userId: string, winnerId: number, loserId: number): Promise<Vote> {
    try {
      // Validate that winner and loser exist
      const [winner, loser] = await Promise.all([
        this.suggestionService.findById(winnerId),
        this.suggestionService.findById(loserId)
      ]);

      if (!winner || !loser) {
        throw new Error('Invalid suggestion IDs');
      }

      // Get user
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has already voted on this pair
      const existingVote = await this.db
        .prepare('SELECT * FROM votes WHERE user_id = ? AND ((winner_id = ? AND loser_id = ?) OR (winner_id = ? AND loser_id = ?))')
        .bind(userId, winnerId, loserId, loserId, winnerId)
        .first();

      if (existingVote) {
        throw new Error('Already voted on this pair');
      }

      // Create vote
      const now = new Date().toISOString();
      const result = await this.db
        .prepare(
          `INSERT INTO votes (winner_id, loser_id, user_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)
           RETURNING *`
        )
        .bind(winnerId, loserId, userId, now, now)
        .first<Vote>();

      if (!result) {
        throw new Error('Failed to create vote');
      }

      // Update ELO scores
      await this.updateEloScores(winner, loser);

      return result;
    } catch (error) {
      console.error('Error in createVote:', error);
      throw error;
    }
  }

  async getUserVotes(userId: string, page: number = 1, limit: number = 10): Promise<{ items: Vote[]; total: number }> {
    const offset = (page - 1) * limit;

    // Décoder l'ID utilisateur qui pourrait contenir des caractères encodés dans l'URL
    const decodedUserId = decodeURIComponent(userId);

    const countResult = await this.db
      .prepare('SELECT COUNT(*) as count FROM votes WHERE user_id = ?')
      .bind(decodedUserId)
      .first<{ count: number }>();

    const votes = await this.db
      .prepare('SELECT * FROM votes WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?')
      .bind(decodedUserId, limit, offset)
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