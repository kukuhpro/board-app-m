import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { IDatabaseAdapter, ITransaction } from '../repositories/interfaces'

/**
 * Supabase adapter for database operations
 */
export class SupabaseAdapter implements IDatabaseAdapter {
  private client: SupabaseClient
  private static instance: SupabaseAdapter | null = null

  private constructor(client: SupabaseClient) {
    this.client = client
  }

  /**
   * Get singleton instance of SupabaseAdapter
   */
  public static getInstance(): SupabaseAdapter {
    if (!SupabaseAdapter.instance) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables')
      }

      const client = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      })
      SupabaseAdapter.instance = new SupabaseAdapter(client)
    }

    return SupabaseAdapter.instance
  }

  /**
   * Create a new adapter instance with a custom client
   */
  public static createInstance(client: SupabaseClient): SupabaseAdapter {
    return new SupabaseAdapter(client)
  }

  /**
   * Get the underlying Supabase client
   */
  public getClient(): SupabaseClient {
    return this.client
  }

  /**
   * Begin a new transaction (not directly supported by Supabase)
   * We'll implement a basic transaction-like behavior
   */
  async beginTransaction(): Promise<ITransaction> {
    // Supabase doesn't support traditional transactions in the client library
    // We'll return a mock transaction object
    return {
      commit: async () => {
        // No-op for Supabase
      },
      rollback: async () => {
        // No-op for Supabase
      }
    }
  }

  /**
   * Execute a query with parameters
   * Note: For Supabase, sql param is treated as table name, params are filters
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    // Treat sql as table name for Supabase compatibility
    const tableName = sql
    let query = this.client.from(tableName).select('*')

    // Apply filters if provided (first param is filters object)
    if (params && params.length > 0 && params[0]) {
      const filters = params[0] as Record<string, any>
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'string' && value.includes('%')) {
            // Support LIKE queries
            query = query.ilike(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Query failed: ${error.message}`)
    }

    return data as T[]
  }

  /**
   * Execute a single query with parameters
   * Note: For Supabase, sql param is treated as table name, params are filters
   */
  async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    const results = await this.query<T>(sql, params)
    return results.length > 0 ? results[0] : null
  }

  /**
   * Execute a mutation (insert, update, delete)
   * Note: For Supabase, sql param contains operation info, params contain data
   */
  async mutate(sql: string, params?: any[]): Promise<number> {
    // Parse sql as operation:tableName format (e.g., "insert:jobs", "update:jobs")
    const [operation, tableName] = sql.split(':')
    const data = params && params.length > 0 ? params[0] : undefined
    const filters = params && params.length > 1 ? params[1] : undefined

    let result: any

    switch (operation.toLowerCase()) {
      case 'insert':
        result = await this.client.from(tableName).insert(data)
        break

      case 'update':
        if (!filters) {
          throw new Error('Update operation requires filters')
        }
        let updateQuery = this.client.from(tableName).update(data)
        Object.entries(filters).forEach(([key, value]) => {
          updateQuery = updateQuery.eq(key, value)
        })
        result = await updateQuery
        break

      case 'delete':
        if (!filters) {
          throw new Error('Delete operation requires filters')
        }
        let deleteQuery = this.client.from(tableName).delete()
        Object.entries(filters).forEach(([key, value]) => {
          deleteQuery = deleteQuery.eq(key, value)
        })
        result = await deleteQuery
        break

      default:
        throw new Error(`Unsupported operation: ${operation}`)
    }

    if (result.error) {
      throw new Error(`Mutation failed: ${result.error.message}`)
    }

    // Return affected rows count (Supabase doesn't provide this directly)
    return result.data ? result.data.length : 0
  }

  /**
   * Helper method for paginated queries
   */
  async queryPaginated<T = any>(
    tableName: string,
    page: number = 1,
    limit: number = 20,
    filters?: Record<string, any>,
    orderBy?: { column: string; ascending?: boolean }
  ): Promise<{ data: T[]; count: number }> {
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = this.client
      .from(tableName)
      .select('*', { count: 'exact' })
      .range(from, to)

    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
    }

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Paginated query failed: ${error.message}`)
    }

    return {
      data: data as T[],
      count: count || 0
    }
  }

  /**
   * Helper method to check if a record exists
   */
  async exists(tableName: string, filters: Record<string, any>): Promise<boolean> {
    let query = this.client.from(tableName).select('id', { count: 'exact', head: true })

    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })

    const { count, error } = await query

    if (error) {
      throw new Error(`Existence check failed: ${error.message}`)
    }

    return (count || 0) > 0
  }

  /**
   * Helper method to count records
   */
  async count(tableName: string, filters?: Record<string, any>): Promise<number> {
    let query = this.client.from(tableName).select('*', { count: 'exact', head: true })

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            query = query.in(key, value)
          } else if (typeof value === 'string' && value.includes('%')) {
            query = query.ilike(key, value)
          } else {
            query = query.eq(key, value)
          }
        }
      })
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Count failed: ${error.message}`)
    }

    return count || 0
  }
}