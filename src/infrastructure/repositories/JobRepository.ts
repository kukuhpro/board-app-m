import { Job } from '@/domain/entities/Job'
import { JobType } from '@/domain/valueObjects/JobType'
import { SupabaseAdapter } from '../adapters/SupabaseAdapter'
import {
  IJobRepository,
  JobFilters,
  PaginationOptions,
  PaginatedResult
} from './interfaces'

/**
 * Repository implementation for Job entity using Supabase
 */
export class JobRepository implements IJobRepository {
  private adapter: SupabaseAdapter
  private readonly TABLE_NAME = 'jobs'

  constructor(adapter?: SupabaseAdapter) {
    this.adapter = adapter || SupabaseAdapter.getInstance()
  }

  /**
   * Create a new job
   */
  async create(job: Omit<JobProps, 'id' | 'createdAt' | 'updatedAt'>): Promise<Job> {
    const client = this.adapter.getClient()

    const { data, error } = await client
      .from(this.TABLE_NAME)
      .insert({
        title: job.title,
        company: job.company,
        description: job.description,
        location: job.location,
        job_type: job.jobType,
        user_id: job.userId
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`)
    }

    return this.mapToDomainEntity(data)
  }

  /**
   * Find a job by ID
   */
  async findById(id: string): Promise<Job | null> {
    const client = this.adapter.getClient()

    const { data, error } = await client
      .from(this.TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null
      }
      throw new Error(`Failed to find job: ${error.message}`)
    }

    return data ? this.mapToDomainEntity(data) : null
  }

  /**
   * Find all jobs with optional filters and pagination
   */
  async findAll(
    filters?: JobFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Job>> {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const orderBy = pagination?.orderBy || 'createdAt'
    const orderDirection = pagination?.orderDirection || 'desc'

    const from = (page - 1) * limit
    const to = from + limit - 1

    const client = this.adapter.getClient()
    let query = client
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact' })

    // Apply filters
    if (filters) {
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }
      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.searchTerm) {
        // Search in title, company, and description
        query = query.or(
          `title.ilike.%${filters.searchTerm}%,` +
          `company.ilike.%${filters.searchTerm}%,` +
          `description.ilike.%${filters.searchTerm}%`
        )
      }
    }

    // Apply ordering
    const orderColumn = this.mapOrderByColumn(orderBy)
    query = query.order(orderColumn, { ascending: orderDirection === 'asc' })

    // Apply pagination
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to find jobs: ${error.message}`)
    }

    const total = count || 0
    const totalPages = Math.ceil(total / limit)

    return {
      data: (data || []).map(this.mapToDomainEntity),
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages
    }
  }

  /**
   * Find all jobs by a specific user
   */
  async findByUserId(
    userId: string,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Job>> {
    return this.findAll({ userId }, pagination)
  }

  /**
   * Update an existing job
   */
  async update(
    id: string,
    data: Partial<Omit<JobProps, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Job> {
    const client = this.adapter.getClient()

    const updateData: any = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.company !== undefined) updateData.company = data.company
    if (data.description !== undefined) updateData.description = data.description
    if (data.location !== undefined) updateData.location = data.location
    if (data.jobType !== undefined) updateData.job_type = data.jobType

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString()

    const { data: updatedData, error } = await client
      .from(this.TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update job: ${error.message}`)
    }

    if (!updatedData) {
      throw new Error('Job not found')
    }

    return this.mapToDomainEntity(updatedData)
  }

  /**
   * Delete a job
   */
  async delete(id: string): Promise<boolean> {
    const client = this.adapter.getClient()

    const { error } = await client
      .from(this.TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete job: ${error.message}`)
    }

    // Check if the job was actually deleted
    const exists = await this.exists(id)
    return !exists
  }

  /**
   * Check if a job exists
   */
  async exists(id: string): Promise<boolean> {
    const client = this.adapter.getClient()

    const { count, error } = await client
      .from(this.TABLE_NAME)
      .select('id', { count: 'exact', head: true })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to check job existence: ${error.message}`)
    }

    return (count || 0) > 0
  }

  /**
   * Count jobs with optional filters
   */
  async count(filters?: JobFilters): Promise<number> {
    const client = this.adapter.getClient()
    let query = client
      .from(this.TABLE_NAME)
      .select('*', { count: 'exact', head: true })

    // Apply filters
    if (filters) {
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }
      if (filters.jobType) {
        query = query.eq('job_type', filters.jobType)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.searchTerm) {
        query = query.or(
          `title.ilike.%${filters.searchTerm}%,` +
          `company.ilike.%${filters.searchTerm}%,` +
          `description.ilike.%${filters.searchTerm}%`
        )
      }
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count jobs: ${error.message}`)
    }

    return count || 0
  }

  /**
   * Map database record to domain entity
   */
  private mapToDomainEntity(data: any): Job {
    return {
      id: data.id,
      title: data.title,
      company: data.company,
      description: data.description,
      location: data.location,
      jobType: data.job_type as JobType,
      userId: data.user_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    }
  }

  /**
   * Map order by field to database column
   */
  private mapOrderByColumn(orderBy: string): string {
    const mappings: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      title: 'title',
      company: 'company'
    }
    return mappings[orderBy] || 'created_at'
  }

  /**
   * Verify ownership of a job
   */
  async verifyOwnership(jobId: string, userId: string): Promise<boolean> {
    const job = await this.findById(jobId)
    return job !== null && job.userId === userId
  }

  /**
   * Get recent jobs
   */
  async getRecentJobs(limit: number = 10): Promise<Job[]> {
    const result = await this.findAll(
      undefined,
      {
        page: 1,
        limit,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      }
    )
    return result.data
  }

  /**
   * Get jobs by location
   */
  async getJobsByLocation(location: string): Promise<Job[]> {
    const result = await this.findAll(
      { location },
      { page: 1, limit: 100 }
    )
    return result.data
  }

  /**
   * Get jobs by type
   */
  async getJobsByType(jobType: JobType): Promise<Job[]> {
    const result = await this.findAll(
      { jobType },
      { page: 1, limit: 100 }
    )
    return result.data
  }

  /**
   * Search jobs by keyword
   */
  async searchJobs(keyword: string): Promise<Job[]> {
    const result = await this.findAll(
      { searchTerm: keyword },
      { page: 1, limit: 50 }
    )
    return result.data
  }
}