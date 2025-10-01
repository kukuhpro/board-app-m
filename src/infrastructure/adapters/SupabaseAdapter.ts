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
   */
  async query<T = any>(tableName: string, filters?: Record<string, any>): Promise<T[]> {
    let query = this.client.from(tableName).select('*')

    // Apply filters if provided
    if (filters) {
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
   */
  async queryOne<T = any>(tableName: string, filters?: Record<string, any>): Promise<T | null> {
    const results = await this.query<T>(tableName, filters)
    return results.length > 0 ? results[0] : null
  }

  /**
   * Execute a mutation (insert, update, delete)
   */
  async mutate(operation: string, tableName: string, data?: any, filters?: Record<string, any>): Promise<number> {
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