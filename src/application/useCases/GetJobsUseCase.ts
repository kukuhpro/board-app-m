import { Job } from '@/domain/entities/Job'
import { JobType } from '@/domain/valueObjects/JobType'
import {
  IJobRepository,
  JobFilters,
  PaginationOptions,
  PaginatedResult
} from '@/infrastructure/repositories/interfaces'
import { JobRepository } from '@/infrastructure/repositories/JobRepository'

/**
 * Input for the GetJobs use case
 */
export interface GetJobsInput {
  location?: string
  jobType?: JobType
  searchTerm?: string
  userId?: string // For filtering by specific user
  page?: number
  limit?: number
  orderBy?: 'createdAt' | 'updatedAt' | 'title' | 'company'
  orderDirection?: 'asc' | 'desc'
}

/**
 * Output of the GetJobs use case
 */
export interface GetJobsOutput {
  success: boolean
  data?: PaginatedResult<Job>
  error?: string
}

/**
 * Use case for retrieving job listings
 */
export class GetJobsUseCase {
  private jobRepository: IJobRepository
  private readonly DEFAULT_PAGE_SIZE = 20
  private readonly MAX_PAGE_SIZE = 100

  constructor(jobRepository?: IJobRepository) {
    this.jobRepository = jobRepository || new JobRepository()
  }

  /**
   * Execute the use case
   * @param input The filters and pagination options
   * @returns The paginated list of jobs
   */
  async execute(input: GetJobsInput = {}): Promise<GetJobsOutput> {
    try {
      // Validate and sanitize pagination parameters
      const page = this.validatePageNumber(input.page)
      const limit = this.validatePageSize(input.limit)

      // Build filters
      const filters: JobFilters = {}

      if (input.location) {
        // Sanitize location input
        filters.location = this.sanitizeSearchTerm(input.location)
      }

      if (input.jobType) {
        // Validate job type
        if (!this.isValidJobType(input.jobType)) {
          return {
            success: false,
            error: 'Invalid job type specified'
          }
        }
        filters.jobType = input.jobType
      }

      if (input.searchTerm) {
        // Sanitize search term
        filters.searchTerm = this.sanitizeSearchTerm(input.searchTerm)
      }

      if (input.userId) {
        // Filter by specific user (for "My Jobs" functionality)
        filters.userId = input.userId
      }

      // Build pagination options
      const pagination: PaginationOptions = {
        page,
        limit,
        orderBy: input.orderBy || 'createdAt',
        orderDirection: input.orderDirection || 'desc'
      }

      // Validate ordering options
      if (pagination.orderBy && !this.isValidOrderBy(pagination.orderBy)) {
        return {
          success: false,
          error: 'Invalid order by field'
        }
      }

      // Fetch jobs from repository
      const result = await this.jobRepository.findAll(filters, pagination)

      // Enhance job data if needed
      const enhancedData = await this.enhanceJobData(result)

      // Cache frequently accessed queries
      this.cacheResults(input, enhancedData)

      return {
        success: true,
        data: enhancedData
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)

      return {
        success: false,
        error: error instanceof Error
          ? `Failed to fetch jobs: ${error.message}`
          : 'An unexpected error occurred while fetching jobs'
      }
    }
  }

  /**
   * Get featured/promoted jobs
   * @param limit Number of featured jobs to return
   * @returns Featured jobs
   */
  async getFeaturedJobs(limit: number = 5): Promise<GetJobsOutput> {
    try {
      // In a real system, featured jobs might have a special flag or be sponsored
      // For now, we'll return the most recent jobs
      const result = await this.jobRepository.findAll(
        {},
        {
          page: 1,
          limit,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )

      return {
        success: true,
        data: result
      }
    } catch (error) {
      console.error('Error fetching featured jobs:', error)

      return {
        success: false,
        error: 'Failed to fetch featured jobs'
      }
    }
  }

  /**
   * Get jobs by specific location
   * @param location The location to filter by
   * @param limit Maximum number of results
   * @returns Jobs in the specified location
   */
  async getJobsByLocation(
    location: string,
    limit: number = 20
  ): Promise<GetJobsOutput> {
    return this.execute({
      location,
      limit,
      page: 1
    })
  }

  /**
   * Get jobs by specific type
   * @param jobType The job type to filter by
   * @param limit Maximum number of results
   * @returns Jobs of the specified type
   */
  async getJobsByType(
    jobType: JobType,
    limit: number = 20
  ): Promise<GetJobsOutput> {
    return this.execute({
      jobType,
      limit,
      page: 1
    })
  }

  /**
   * Search jobs by keyword
   * @param searchTerm The search term
   * @param page Page number
   * @param limit Page size
   * @returns Search results
   */
  async searchJobs(
    searchTerm: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetJobsOutput> {
    return this.execute({
      searchTerm,
      page,
      limit
    })
  }

  /**
   * Get user's posted jobs
   * @param userId The user ID
   * @param page Page number
   * @param limit Page size
   * @returns User's jobs
   */
  async getUserJobs(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetJobsOutput> {
    if (!userId) {
      return {
        success: false,
        error: 'User ID is required'
      }
    }

    return this.execute({
      userId,
      page,
      limit,
      orderBy: 'createdAt',
      orderDirection: 'desc'
    })
  }

  /**
   * Validate page number
   * @param page The page number to validate
   * @returns Valid page number
   */
  private validatePageNumber(page?: number): number {
    if (!page || page < 1) {
      return 1
    }
    return Math.floor(page)
  }

  /**
   * Validate page size
   * @param limit The page size to validate
   * @returns Valid page size
   */
  private validatePageSize(limit?: number): number {
    if (!limit || limit < 1) {
      return this.DEFAULT_PAGE_SIZE
    }
    if (limit > this.MAX_PAGE_SIZE) {
      return this.MAX_PAGE_SIZE
    }
    return Math.floor(limit)
  }

  /**
   * Validate job type
   * @param jobType The job type to validate
   * @returns True if valid
   */
  private isValidJobType(jobType: string): boolean {
    return Object.values(JobType).includes(jobType as JobType)
  }

  /**
   * Validate order by field
   * @param orderBy The field to order by
   * @returns True if valid
   */
  private isValidOrderBy(orderBy: string): boolean {
    const validFields = ['createdAt', 'updatedAt', 'title', 'company']
    return validFields.includes(orderBy)
  }

  /**
   * Sanitize search term to prevent injection attacks
   * @param term The search term to sanitize
   * @returns Sanitized search term
   */
  private sanitizeSearchTerm(term: string): string {
    // Remove special characters that might be used for SQL injection
    // Keep alphanumeric, spaces, and basic punctuation
    return term
      .replace(/[^\w\s\-.,]/gi, '')
      .trim()
      .substring(0, 100) // Limit length
  }

  /**
   * Enhance job data with additional information
   * @param result The raw job data
   * @returns Enhanced job data
   */
  private async enhanceJobData(
    result: PaginatedResult<Job>
  ): Promise<PaginatedResult<Job>> {
    // In a real system, you might:
    // 1. Add company logos
    // 2. Calculate "time ago" strings
    // 3. Add application counts
    // 4. Check if user has applied (if authenticated)

    return result
  }

  /**
   * Cache frequently accessed results
   * @param input The query parameters
   * @param result The query results
   */
  private cacheResults(
    input: GetJobsInput,
    result: PaginatedResult<Job>
  ): void {
    // In a production system, this would cache to Redis or similar
    // Cache key would be based on input parameters
    const cacheKey = this.buildCacheKey(input)

    console.log('Caching results:', {
      key: cacheKey,
      resultCount: result.data.length,
      expiresIn: '5 minutes'
    })
  }

  /**
   * Build cache key from input parameters
   * @param input The query parameters
   * @returns Cache key
   */
  private buildCacheKey(input: GetJobsInput): string {
    const parts = [
      'jobs',
      input.page || 1,
      input.limit || this.DEFAULT_PAGE_SIZE,
      input.location || 'all',
      input.jobType || 'all',
      input.searchTerm || 'none',
      input.userId || 'public',
      input.orderBy || 'createdAt',
      input.orderDirection || 'desc'
    ]

    return parts.join(':')
  }
}