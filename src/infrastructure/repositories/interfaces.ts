import { Job } from '@/domain/entities/Job'
import { JobType } from '@/domain/valueObjects/JobType'

/**
 * Filter options for querying jobs
 */
export interface JobFilters {
  location?: string
  jobType?: JobType
  userId?: string
  searchTerm?: string
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'company'
  orderDirection?: 'asc' | 'desc'
}

/**
 * Result of a paginated query
 */
export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

/**
 * Repository interface for Job entity
 */
export interface IJobRepository {
  /**
   * Create a new job
   * @param job The job data to create
   * @returns The created job with generated ID
   */
  create(job: Omit<JobProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job>

  /**
   * Find a job by ID
   * @param id The job ID
   * @returns The job if found, null otherwise
   */
  findById(id: string): Promise<Job | null>

  /**
   * Find all jobs with optional filters and pagination
   * @param filters Optional filters to apply
   * @param pagination Optional pagination settings
   * @returns Paginated list of jobs
   */
  findAll(
    filters?: JobFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Job>>

  /**
   * Find all jobs by a specific user
   * @param userId The user ID
   * @param pagination Optional pagination settings
   * @returns Paginated list of user's jobs
   */
  findByUserId(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Job>>

  /**
   * Update an existing job
   * @param id The job ID
   * @param data The partial job data to update
   * @returns The updated job
   */
  update(id: string, data: Partial<Omit<JobProps, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Job>

  /**
   * Delete a job
   * @param id The job ID
   * @returns True if deleted, false if not found
   */
  delete(id: string): Promise<boolean>

  /**
   * Check if a job exists
   * @param id The job ID
   * @returns True if exists, false otherwise
   */
  exists(id: string): Promise<boolean>

  /**
   * Count jobs with optional filters
   * @param filters Optional filters to apply
   * @returns The count of jobs
   */
  count(filters?: JobFilters): Promise<number>
}

/**
 * Database transaction interface
 */
export interface ITransaction {
  commit(): Promise<void>
  rollback(): Promise<void>
}

/**
 * Database adapter interface
 */
export interface IDatabaseAdapter {
  /**
   * Begin a new transaction
   */
  beginTransaction(): Promise<ITransaction>

  /**
   * Execute a query with parameters
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>

  /**
   * Execute a single query with parameters
   */
  queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>

  /**
   * Execute a mutation (insert, update, delete)
   */
  mutate(sql: string, params?: any[]): Promise<number>
}