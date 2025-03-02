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

describe('Vote Flow Integration', () => {
  let voteService: VoteService;
  let suggestionService: SuggestionService;
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnThis();
    mockDb.bind.mockReturnThis();
    
    // Create real service instances with mock DB
    userService = new UserService(mockDb as any);
    suggestionService = new SuggestionService(mockDb as any);
    voteService = new VoteService(mockDb as any, suggestionService, userService);
    
    // Reset mocks
    vi.spyOn(userService, 'getUserById');
    vi.spyOn(suggestionService, 'findById');
    vi.spyOn(suggestionService, 'getRandomPairForVoting');
  });

  describe('Complete voting flow', () => {
    it('should successfully complete the full voting flow', async () => {
      // Mock user
      const mockUser = { 
        id: 'user1', 
        email: 'user1@example.com', 
        name: 'User 1',
        daily_suggestions_count: 0,
        last_suggestion_date: null
      };
      
      // Mock suggestions for random pair
      const mockSuggestions = [
        { id: 1, description: 'Suggestion 1', user_id: 'user2', created_at: new Date(), updated_at: new Date() },
        { id: 2, description: 'Suggestion 2', user_id: 'user3', created_at: new Date(), updated_at: new Date() }
      ];
      
      // Mock vote result
      const mockVote = { 
        id: 1, 
        winner_id: 1, 
        loser_id: 2, 
        user_id: 'user1', 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      };
      
      // Setup mocks for getRandomPairForVoting
      mockDb.all.mockResolvedValueOnce({ results: mockSuggestions });
      mockDb.first.mockResolvedValueOnce({ count: 10 });
      
      // Setup mocks for getUserById
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      // Setup mocks for findById in createVote
      mockDb.first.mockResolvedValueOnce(mockSuggestions[0]);
      mockDb.first.mockResolvedValueOnce(mockSuggestions[1]);
      
      // Setup mock for checking existing votes
      mockDb.first.mockResolvedValueOnce(null);
      
      // Setup mock for creating vote
      mockDb.first.mockResolvedValueOnce(mockVote);
      
      // Setup mocks for getSuggestionElo
      mockDb.first.mockResolvedValueOnce({ elo_score: 1500 });
      mockDb.first.mockResolvedValueOnce({ elo_score: 1500 });
      
      // Setup mocks for updateEloScores
      mockDb.run.mockResolvedValueOnce({ success: true });
      mockDb.run.mockResolvedValueOnce({ success: true });
      
      // Step 1: Get a random pair of suggestions
      const randomPairResult = await suggestionService.getRandomPairForVoting('user1');
      
      // Verify random pair result
      expect(randomPairResult.pair).toHaveLength(2);
      expect(randomPairResult.remainingCount).toBe(10);
      
      // Step 2: User votes on the pair (selects winner)
      const winnerId = randomPairResult.pair[0].id;
      const loserId = randomPairResult.pair[1].id;
      
      // Create the vote
      const voteResult = await voteService.createVote('user1', winnerId, loserId);
      
      // Verify vote result
      expect(voteResult).toEqual(mockVote);
      
      // Verify that ELO scores were updated
      expect(mockDb.prepare).toHaveBeenCalledWith('UPDATE suggestions SET elo_score = ? WHERE id = ?');
      
      // Verify the complete flow
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RANDOM()'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO votes'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE suggestions SET elo_score'));
    });
    
    it('should verify non-repetition of suggestions in voting', async () => {
      // Mock user
      const mockUser = { id: 'user1' };
      
      // Mock suggestions for first random pair
      const firstPairSuggestions = [
        { id: 1, description: 'Suggestion 1', user_id: 'user2', created_at: new Date(), updated_at: new Date() },
        { id: 2, description: 'Suggestion 2', user_id: 'user3', created_at: new Date(), updated_at: new Date() }
      ];
      
      // Mock suggestions for second random pair (should be different)
      const secondPairSuggestions = [
        { id: 3, description: 'Suggestion 3', user_id: 'user4', created_at: new Date(), updated_at: new Date() },
        { id: 4, description: 'Suggestion 4', user_id: 'user5', created_at: new Date(), updated_at: new Date() }
      ];
      
      // Setup mocks for first getRandomPairForVoting
      mockDb.all.mockResolvedValueOnce({ results: firstPairSuggestions });
      mockDb.first.mockResolvedValueOnce({ count: 10 });
      
      // Setup mocks for getUserById
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      // Setup mocks for findById in first createVote
      mockDb.first.mockResolvedValueOnce(firstPairSuggestions[0]);
      mockDb.first.mockResolvedValueOnce(firstPairSuggestions[1]);
      
      // Setup mock for checking existing votes
      mockDb.first.mockResolvedValueOnce(null);
      
      // Setup mock for creating first vote
      mockDb.first.mockResolvedValueOnce({ 
        id: 1, 
        winner_id: 1, 
        loser_id: 2, 
        user_id: 'user1', 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      });
      
      // Setup mocks for getSuggestionElo
      mockDb.first.mockResolvedValueOnce({ elo_score: 1500 });
      mockDb.first.mockResolvedValueOnce({ elo_score: 1500 });
      
      // Setup mocks for updateEloScores
      mockDb.run.mockResolvedValueOnce({ success: true });
      mockDb.run.mockResolvedValueOnce({ success: true });
      
      // Setup mocks for second getRandomPairForVoting
      mockDb.all.mockResolvedValueOnce({ results: secondPairSuggestions });
      mockDb.first.mockResolvedValueOnce({ count: 8 }); // 2 less than before
      
      // Step 1: Get first random pair and vote
      const firstPair = await suggestionService.getRandomPairForVoting('user1');
      await voteService.createVote('user1', firstPair.pair[0].id, firstPair.pair[1].id);
      
      // Step 2: Get second random pair
      const secondPair = await suggestionService.getRandomPairForVoting('user1');
      
      // Verify that the second pair is different from the first
      expect(secondPair.pair[0].id).not.toBe(firstPair.pair[0].id);
      expect(secondPair.pair[0].id).not.toBe(firstPair.pair[1].id);
      expect(secondPair.pair[1].id).not.toBe(firstPair.pair[0].id);
      expect(secondPair.pair[1].id).not.toBe(firstPair.pair[1].id);
      
      // Verify that the remaining count decreased
      expect(secondPair.remainingCount).toBe(8);
      
      // Verify that the query excludes previously voted suggestions
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('NOT IN'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT winner_id FROM votes WHERE user_id = ?'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT loser_id FROM votes WHERE user_id = ?'));
    });
  });
}); 