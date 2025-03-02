export interface User {
  id: string;
  email: string;
  name: string;
  daily_votes_count: number;
  daily_suggestions_count: number;
  last_vote_date: string | null;
  last_suggestion_date: string | null;
  created_at: string;
  updated_at: string;
}

export class UserService {
  constructor(private db: D1Database) {}

  async createOrUpdateUser(id: string, email: string, name: string): Promise<User> {
    const now = new Date().toISOString();

    // Try to update first
    const updateResult = await this.db
      .prepare(
        `UPDATE users 
         SET email = ?, name = ?, updated_at = ?
         WHERE id = ?
         RETURNING *`
      )
      .bind(email, name, now, id)
      .first<User>();

    if (updateResult) {
      return this.checkAndResetDailyLimits(updateResult);
    }

    // If update didn't affect any rows, insert new user
    const insertResult = await this.db
      .prepare(
        `INSERT INTO users (
          id, email, name, 
          daily_votes_count, daily_suggestions_count,
          last_vote_date, last_suggestion_date,
          created_at, updated_at
        ) VALUES (?, ?, ?, 0, 0, NULL, NULL, ?, ?)
         RETURNING *`
      )
      .bind(id, email, name, now, now)
      .first<User>();

    if (!insertResult) {
      throw new Error('Failed to create user');
    }

    return insertResult;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
    
    if (user) {
      return this.checkAndResetDailyLimits(user);
    }
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
    
    if (user) {
      return this.checkAndResetDailyLimits(user);
    }
    
    return user;
  }
  
  // Vérifie si la date de dernière suggestion est d'un jour différent
  // et réinitialise le compteur si nécessaire
  private async checkAndResetDailyLimits(user: User): Promise<User> {
    // Obtenir la date actuelle dans le fuseau horaire de Toronto/Montréal (Eastern Time)
    const todayInET = this.getDateInEasternTime();
    
    // Vérifier si la dernière suggestion date d'un jour différent
    const lastSuggestionDate = user.last_suggestion_date ? 
      this.getDateInEasternTime(new Date(user.last_suggestion_date)) : null;
    
    console.log('!!!!!!!!!!!!!!!!!');
    console.log('lastSuggestionDate', lastSuggestionDate);
    console.log('user.daily_suggestions_count', user.daily_suggestions_count);
    console.log('todayInET', todayInET);
    
    // Si la dernière suggestion date d'un jour différent ou est null,
    // on réinitialise le compteur dans la base de données
    if (lastSuggestionDate !== todayInET) {
      console.log(`Resetting daily suggestions count for user ${user.id}. Last date: ${lastSuggestionDate}, Today in ET: ${todayInET}`);
      
      const now = new Date().toISOString();
      const updatedUser = await this.db
        .prepare(
          `UPDATE users 
           SET daily_suggestions_count = 0, updated_at = ?
           WHERE id = ?
           RETURNING *`
        )
        .bind(now, user.id)
        .first<User>();
      
      if (updatedUser) {
        return updatedUser;
      }
    }
    
    return user;
  }
  
  // Fonction pour obtenir la date au format YYYY-MM-DD dans le fuseau horaire de Toronto/Montréal
  private getDateInEasternTime(date: Date = new Date()): string {
    // Options pour formatter la date dans le fuseau horaire Eastern Time
    const options: Intl.DateTimeFormatOptions = {
      timeZone: 'America/Toronto',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };
    
    // Formatter la date
    const formatter = new Intl.DateTimeFormat('fr-CA', options);
    const formattedDate = formatter.format(date);
    
    // Le format fr-CA est déjà YYYY-MM-DD
    return formattedDate;
  }
} 