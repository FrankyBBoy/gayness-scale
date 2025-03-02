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
      const mockSuggestions = [
        { id: 1, description: 'Suggestion 1', user_id: 'user1', created_at: new Date(), updated_at: new Date() },
        { id: 2, description: 'Suggestion 2', user_id: 'user2', created_at: new Date(), updated_at: new Date() }
      ];
      
      // Mock DB responses
      mockDb.all.mockResolvedValueOnce({ results: mockSuggestions });
      mockDb.first.mockResolvedValueOnce({ count: 10 });

      // Call the method
      const result = await suggestionService.getRandomPairForVoting('user3');

      // Assertions
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RANDOM()'));
      expect(mockDb.bind).toHaveBeenCalledWith('user3', 'user3');
      expect(result.pair).toHaveLength(2);
      expect(result.pair).toEqual(mockSuggestions);
      expect(result.remainingCount).toBe(10);
    });

    it('should throw an error when there are not enough suggestions', async () => {
      // Mock DB response with less than 2 suggestions
      mockDb.all.mockResolvedValueOnce({ results: [{ id: 1, description: 'Suggestion 1' }] });

      // Expect the method to throw an error
      await expect(suggestionService.getRandomPairForVoting('user3')).rejects.toThrow('No more suggestions to vote on');
    });

    it('should exclude suggestions already voted on by the user', async () => {
      // Call the method
      try {
        await suggestionService.getRandomPairForVoting('user3');
      } catch (error) {
        // We don't care about the result, just that the query is correct
      }

      // Verify that the query excludes suggestions already voted on
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('NOT IN'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT winner_id FROM votes WHERE user_id = ?'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT loser_id FROM votes WHERE user_id = ?'));
    });
  });
}); 