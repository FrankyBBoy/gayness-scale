import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService, User } from '../../src/services/user.service';

// Mock D1Database
const mockDb = {
  prepare: vi.fn().mockReturnThis(),
  bind: vi.fn().mockReturnThis(),
  first: vi.fn(),
  all: vi.fn(),
  run: vi.fn()
};

describe('UserService', () => {
  let userService: UserService;
  let mockUser: User;
  
  // Mock pour la méthode getDateInEasternTime
  const mockGetDateInEasternTime = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.prepare.mockReturnThis();
    mockDb.bind.mockReturnThis();
    
    // Créer une instance du service avec le mock DB
    userService = new UserService(mockDb as any);
    
    // Remplacer la méthode privée getDateInEasternTime par un mock
    (userService as any).getDateInEasternTime = mockGetDateInEasternTime;
    
    // Définir un utilisateur mock pour les tests
    mockUser = {
      id: 'user1',
      email: 'user1@example.com',
      name: 'Test User',
      daily_votes_count: 3,
      daily_suggestions_count: 2,
      last_vote_date: '2023-05-01T12:00:00Z',
      last_suggestion_date: '2023-05-01T14:00:00Z',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-05-01T14:00:00Z'
    };
  });

  describe('createOrUpdateUser', () => {
    it('should update an existing user and check daily limits', async () => {
      // Configurer le mock pour retourner un utilisateur existant
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      // Configurer le mock pour getDateInEasternTime
      mockGetDateInEasternTime.mockReturnValue('2023-05-01');
      
      // Appeler la méthode
      const result = await userService.createOrUpdateUser('user1', 'user1@example.com', 'Test User');
      
      // Vérifier que la requête UPDATE a été appelée
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
      expect(mockDb.bind).toHaveBeenCalledWith('user1@example.com', 'Test User', expect.any(String), 'user1');
      
      // Vérifier que checkAndResetDailyLimits a été appelé (via le mock getDateInEasternTime)
      expect(mockGetDateInEasternTime).toHaveBeenCalled();
      
      // Vérifier le résultat
      expect(result).toEqual(mockUser);
    });

    it('should create a new user if update fails', async () => {
      // Configurer le mock pour simuler qu'aucun utilisateur n'existe
      mockDb.first.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
      
      // Appeler la méthode
      const result = await userService.createOrUpdateUser('user1', 'user1@example.com', 'Test User');
      
      // Vérifier que la requête INSERT a été appelée après l'échec de UPDATE
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO users'));
      expect(mockDb.bind).toHaveBeenCalledWith('user1', 'user1@example.com', 'Test User', expect.any(String), expect.any(String));
      
      // Vérifier le résultat
      expect(result).toEqual(mockUser);
    });
  });

  describe('getUserById', () => {
    it('should return a user by ID and check daily limits', async () => {
      // Configurer le mock pour retourner un utilisateur
      mockDb.first.mockResolvedValueOnce(mockUser);
      
      // Configurer le mock pour getDateInEasternTime
      mockGetDateInEasternTime.mockReturnValue('2023-05-01');
      
      // Appeler la méthode
      const result = await userService.getUserById('user1');
      
      // Vérifier que la requête SELECT a été appelée
      expect(mockDb.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?');
      expect(mockDb.bind).toHaveBeenCalledWith('user1');
      
      // Vérifier que checkAndResetDailyLimits a été appelé (via le mock getDateInEasternTime)
      expect(mockGetDateInEasternTime).toHaveBeenCalled();
      
      // Vérifier le résultat
      expect(result).toEqual(mockUser);
    });
  });

  describe('checkAndResetDailyLimits', () => {
    it('should reset daily suggestions count when last suggestion date is different from today', async () => {
      // Configurer le mock pour getDateInEasternTime pour retourner une date différente
      mockGetDateInEasternTime
        .mockReturnValueOnce('2023-05-02') // Date actuelle
        .mockReturnValueOnce('2023-05-01'); // Date de dernière suggestion
      
      // Configurer le mock pour retourner un utilisateur mis à jour
      const updatedUser = { ...mockUser, daily_suggestions_count: 0 };
      mockDb.first.mockResolvedValueOnce(updatedUser);
      
      // Appeler la méthode privée directement
      const result = await (userService as any).checkAndResetDailyLimits(mockUser);
      
      // Vérifier que la requête UPDATE a été appelée pour réinitialiser le compteur
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SET daily_suggestions_count = 0'));
      expect(mockDb.bind).toHaveBeenCalledWith(expect.any(String), 'user1');
      
      // Vérifier le résultat
      expect(result).toEqual(updatedUser);
    });

    it('should not reset daily suggestions count when last suggestion date is the same as today', async () => {
      // Configurer le mock pour getDateInEasternTime pour retourner la même date
      mockGetDateInEasternTime
        .mockReturnValueOnce('2023-05-01') // Date actuelle
        .mockReturnValueOnce('2023-05-01'); // Date de dernière suggestion
      
      // Appeler la méthode privée directement
      const result = await (userService as any).checkAndResetDailyLimits(mockUser);
      
      // Vérifier que la requête UPDATE n'a pas été appelée
      expect(mockDb.prepare).not.toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
      
      // Vérifier que le résultat est l'utilisateur original sans modification
      expect(result).toEqual(mockUser);
    });

    it('should reset daily suggestions count when last_suggestion_date is null', async () => {
      // Créer un utilisateur sans date de dernière suggestion
      const userWithoutLastSuggestion = { ...mockUser, last_suggestion_date: null };
      
      // Configurer le mock pour getDateInEasternTime
      mockGetDateInEasternTime.mockReturnValue('2023-05-02'); // Date actuelle
      
      // Configurer le mock pour retourner un utilisateur mis à jour
      const updatedUser = { ...userWithoutLastSuggestion, daily_suggestions_count: 0 };
      mockDb.first.mockResolvedValueOnce(updatedUser);
      
      // Appeler la méthode privée directement
      const result = await (userService as any).checkAndResetDailyLimits(userWithoutLastSuggestion);
      
      // Vérifier que la requête UPDATE a été appelée pour réinitialiser le compteur
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE users'));
      expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SET daily_suggestions_count = 0'));
      
      // Vérifier le résultat
      expect(result).toEqual(updatedUser);
    });
  });

  describe('getDateInEasternTime', () => {
    it('should format date in Eastern Time zone', () => {
      // Restaurer la méthode originale pour ce test
      vi.restoreAllMocks();
      userService = new UserService(mockDb as any);
      
      // Créer une date fixe pour le test (1er mai 2023, 12:00 UTC)
      const testDate = new Date('2023-05-01T12:00:00Z');
      
      // Appeler la méthode privée directement
      const result = (userService as any).getDateInEasternTime(testDate);
      
      // Vérifier que le résultat est au format YYYY-MM-DD
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      
      // Note: Le résultat exact dépendra du fuseau horaire, mais nous pouvons vérifier le format
    });
  });
}); 