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
      // Mock data
      const mockRow = {
        id: 1, description: 'Suggestion 1', user_id: 'user1', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01',
        id2: 2, description2: 'Suggestion 2', user_id2: 'user2', elo_score2: 1500, created_at2: '2025-01-01', updated_at2: '2025-01-01'
      };
      
      // Mock DB responses
      mockDb.all.mockResolvedValueOnce({ results: [mockRow] });

      // Call the method
      const result = await suggestionService.getRandomPairForVoting('user3');

      // Assertions
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RANDOM()'));
      expect(mockDb.bind).toHaveBeenCalledWith('user3');
      expect(result.pair).toHaveLength(2);
      expect(result.pair[0].id).toBe(1);
      expect(result.pair[1].id).toBe(2);
    });

    it('should throw an error when there are not enough suggestions', async () => {
      // Mock DB response with no results
      mockDb.all.mockResolvedValueOnce({ results: [] });

      // Expect the method to throw an error
      await expect(suggestionService.getRandomPairForVoting('user3')).rejects.toThrow('No more suggestions to vote on');
    });

    it('should exclude suggestions already voted on as pairs', async () => {
      // Mock data for successful response
      const mockRow = {
        id: 1, description: 'Suggestion 1', user_id: 'user1', elo_score: 1500, created_at: '2025-01-01', updated_at: '2025-01-01',
        id2: 2, description2: 'Suggestion 2', user_id2: 'user2', elo_score2: 1500, created_at2: '2025-01-01', updated_at2: '2025-01-01'
      };
      
      mockDb.all.mockResolvedValueOnce({ results: [mockRow] });
      
      // Call the method
      await suggestionService.getRandomPairForVoting('user3');

      // Verify that the query uses the correct approach to find unvoted pairs
      expect(mockDb.prepare.mock.calls[0][0]).toContain('voted_pairs');
      expect(mockDb.prepare.mock.calls[0][0]).toContain('WHERE user_id = ?');
      expect(mockDb.prepare.mock.calls[0][0]).toContain('unvoted_pairs');
    });
  });
}); 