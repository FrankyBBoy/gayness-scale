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
      return updateResult;
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
    return await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<User>();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();
  }
} 