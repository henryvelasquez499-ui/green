import { Pool, type PoolClient } from "pg"

export class DatabaseManager {
  private static instance: DatabaseManager
  private pool: Pool

  private constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect()
    try {
      const result = await client.query(sql, params)
      return result.rows
    } finally {
      client.release()
    }
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query("BEGIN")
      const result = await callback(client)
      await client.query("COMMIT")
      return result
    } catch (error) {
      await client.query("ROLLBACK")
      throw error
    } finally {
      client.release()
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.query("SELECT 1")
      return true
    } catch {
      return false
    }
  }
}
