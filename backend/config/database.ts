import { Pool, type PoolClient } from "pg"

interface DatabaseConfig {
  connectionString?: string
  host?: string
  port?: number
  database?: string
  user?: string
  password?: string
  ssl?: boolean | object
  max?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
}

export class DatabaseManager {
  private static instance: DatabaseManager
  private pool: Pool

  private constructor() {
    const config: DatabaseConfig = process.env.DATABASE_URL 
      ? {
          connectionString: process.env.DATABASE_URL,
          ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432'),
          database: process.env.DB_NAME || 'greenloop',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || '',
          ssl: false,
        }

    this.pool = new Pool({
      ...config,
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
