import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VoteService } from '../../src/services/vote.service';
import { SuggestionService } from '../../src/services/suggestion.service';
import { UserService } from '../../src/services/user.service';

// Mock D1Database
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn()
};

// Mock SuggestionService
vi.mock('../../src/services/suggestion.service', () => {
  return {
    SuggestionService: vi.fn().mockImplementation(() => {
      return {
        findById: vi.fn()
      };
    })
  };
});

// Mock UserService
vi.mock('../../src/services/user.service', () => {
  return {
    UserService: vi.fn().mockImplementation(() => {
      return {
        getUserById: vi.fn()
      };
    })
  };
});

describe('VoteService', () => {
  let voteService: VoteService;
  let suggestionService: SuggestionService;
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnThis();
    mockDb.bind.mockReturnThis();
    
    suggestionService = new SuggestionService(mockDb as any);
    userService = new UserService(mockDb as any);
    voteService = new VoteService(mockDb as any, suggestionService as any, userService as any);
  });

  describe('calculateEloChange', () => {
    it('should calculate correct ELO changes for equal ratings', () => {
      // Access the private method using type assertion
      const calculateEloChange = (voteService as any).calculateEloChange.bind(voteService);
      
      const result = calculateEloChange(1500, 1500);
      
      // For equal ratings, the expected score is 0.5, so the change should be K_FACTOR * (1 - 0.5) = 16
      expect(result.winnerChange).toBe(16);
      expect(result.loserChange).toBe(-16);
    });

    it('should calculate higher ELO change when underdog wins', () => {
      // Access the private method using type assertion
      const calculateEloChange = (voteService as any).calculateEloChange.bind(voteService);
      
      // Lower rated player (1400) beats higher rated player (1600)
      const result = calculateEloChange(1400, 1600);
      
      // The change should be higher than the default 16 points
      expect(result.winnerChange).toBeGreaterThan(16);
      expect(result.loserChange).toBeLessThan(-16);
    });

    it('should calculate lower ELO change when favorite wins', () => {
      // Access the private method using type assertion
      const calculateEloChange = (voteService as any).calculateEloChange.bind(voteService);
      
      // Higher rated player (1600) beats lower rated player (1400)
      const result = calculateEloChange(1600, 1400);
      
      // The change should be lower than the default 16 points
      expect(result.winnerChange).toBeLessThan(16);
      expect(result.loserChange).toBeGreaterThan(-16);
    });
  });

  describe('updateEloScores', () => {
    it('should update ELO scores correctly', async () => {
      // Mock getSuggestionElo to return specific ELO scores
      vi.spyOn(voteService as any, 'getSuggestionElo')
        .mockResolvedValueOnce(1500) // Winner ELO
        .mockResolvedValueOnce(1500); // Loser ELO
      
      // Mock the suggestions
      const winner = { id: 1, description: 'Winner', user_id: 'user1', created_at: new Date(), updated_at: new Date() };
      const loser = { id: 2, description: 'Loser', user_id: 'user2', created_at: new Date(), updated_at: new Date() };
      
      // Call the private method
      await (voteService as any).updateEloScores(winner, loser);
      
      // Verify that the database was called to update both ELO scores
      expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE suggestions SET elo_score = ? WHERE id = ?');
      expect(mockDb.bind).toHaveBeenCalledWith(1516, 1); // Winner's new ELO (1500 + 16)
      expect(mockDb.bind).toHaveBeenCalledWith(1484, 2); // Loser's new ELO (1500 - 16)
    });
  });

  describe('createVote', () => {
    it('should create a vote and update ELO scores', async () => {
      // Mock findById to return suggestions
      const winner = { id: 1, description: 'Winner', user_id: 'user1', created_at: new Date(), updated_at: new Date() };
      const loser = { id: 2, description: 'Loser', user_id: 'user2', created_at: new Date(), updated_at: new Date() };
      
      (suggestionService.findById as any).mockResolvedValueOnce(winner).mockResolvedValueOnce(loser);
      
      // Mock getUserById to return a user
      (userService.getUserById as any).mockResolvedValueOnce({ id: 'user3' });
      
      // Mock db.first for checking existing votes
      mockDb.first.mockResolvedValueOnce(null); // No existing vote
      
      // Mock db.first for creating a vote
      const mockVote = { id: 1, winner_id: 1, loser_id: 2, user_id: 'user3', created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
      mockDb.first.mockResolvedValueOnce(mockVote);
      
      // Mock updateEloScores
      vi.spyOn(voteService as any, 'updateEloScores').mockResolvedValueOnce(undefined);
      
      // Call createVote
      const result = await voteService.createVote('user3', 1, 2);
      
      // Verify the result
      expect(result).toEqual(mockVote);
      
      // Verify that updateEloScores was called
      expect((voteService as any).updateEloScores).toHaveBeenCalledWith(winner, loser);
    });

    it('should throw an error if suggestions do not exist', async () => {
      // Mock findById to return null for one suggestion
      (suggestionService.findById as any).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 2 });
      
      // Expect createVote to throw an error
      await expect(voteService.createVote('user3', 1, 2)).rejects.toThrow('Invalid suggestion IDs');
    });

    it('should throw an error if user has already voted on this pair', async () => {
      // Mock findById to return suggestions
      (suggestionService.findById as any)
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce({ id: 2 });
      
      // Mock getUserById to return a user
      (userService.getUserById as any).mockResolvedValueOnce({ id: 'user3' });
      
      // Mock db.first to return an existing vote
      mockDb.first.mockResolvedValueOnce({ id: 1 }); // Existing vote
      
      // Expect createVote to throw an error
      await expect(voteService.createVote('user3', 1, 2)).rejects.toThrow('Already voted on this pair');
    });
  });
}); 