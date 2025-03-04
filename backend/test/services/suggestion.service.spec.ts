import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('SuggestionService', () => {
  let suggestionService: SuggestionService;
  let userService: UserService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnThis();
    mockDb.bind.mockReturnThis();
    
    userService = new UserService(mockDb as any);
    suggestionService = new SuggestionService(mockDb as any);
  });

  describe('getRandomPairForVoting', () => {
    it('should return a pair of random suggestions', async () => {
      // Mock suggestions data
      const mockSuggestions = [
        { id: 1, description: 'Suggestion 1', user_id: 'user1', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: 2, description: 'Suggestion 2', user_id: 'user2', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: 3, description: 'Suggestion 3', user_id: 'user3', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' }
      ];
      
      // Mock voted pairs data (empty for this test)
      const mockVotedPairs: any[] = [];
      
      // Mock DB responses for the two separate queries
      mockDb.all
        .mockResolvedValueOnce({ results: mockSuggestions }) // First query: get suggestions
        .mockResolvedValueOnce({ results: mockVotedPairs }); // Second query: get voted pairs
      
      // Call the method
      const result = await suggestionService.getRandomPairForVoting('user4');

      // Assertions
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
      expect(mockDb.prepare.mock.calls[0][0]).toContain('SELECT id, description, user_id, elo_score');
      expect(mockDb.prepare.mock.calls[1][0]).toContain('CASE WHEN winner_id < loser_id');
      expect(mockDb.bind).toHaveBeenCalledWith('user4');
      expect(result.pair).toHaveLength(2);
      // We can't assert exact IDs since the pair is randomly selected
      expect(result.pair[0].id).toBeDefined();
      expect(result.pair[1].id).toBeDefined();
    });

    it('should throw an error when there are not enough suggestions', async () => {
      // Mock DB response with not enough suggestions
      mockDb.all.mockResolvedValueOnce({ results: [
        { id: 1, description: 'Suggestion 1', user_id: 'user1', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' }
      ] });

      // Expect the method to throw an error
      await expect(suggestionService.getRandomPairForVoting('user3')).rejects.toThrow('Not enough suggestions available');
    });

    it('should exclude suggestions already voted on as pairs', async () => {
      // Mock suggestions data
      const mockSuggestions = [
        { id: 1, description: 'Suggestion 1', user_id: 'user1', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: 2, description: 'Suggestion 2', user_id: 'user2', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' },
        { id: 3, description: 'Suggestion 3', user_id: 'user3', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01' }
      ];
      
      // Mock voted pairs data (pair 1-2 already voted)
      const mockVotedPairs: any[] = [
        { suggestion1_id: 1, suggestion2_id: 2 }
      ];
      
      // Mock DB responses for the two separate queries
      mockDb.all
        .mockResolvedValueOnce({ results: mockSuggestions }) // First query: get suggestions
        .mockResolvedValueOnce({ results: mockVotedPairs }); // Second query: get voted pairs
      
      // Call the method
      const result = await suggestionService.getRandomPairForVoting('user4');

      // Assertions
      expect(mockDb.prepare).toHaveBeenCalledTimes(2);
      expect(mockDb.prepare.mock.calls[0][0]).toContain('SELECT id, description, user_id, elo_score');
      expect(mockDb.prepare.mock.calls[1][0]).toContain('CASE WHEN winner_id < loser_id');
      
      // Verify that the pair 1-2 is not returned (should be pair 1-3 or 2-3)
      const pairIds = [result.pair[0].id, result.pair[1].id].sort();
      expect(pairIds).not.toEqual([1, 2]);
      
      // The only valid pairs should be 1-3 or 2-3
      const validPairs = [[1, 3], [2, 3]];
      expect(validPairs).toContainEqual(pairIds);
    });
  });
}); 