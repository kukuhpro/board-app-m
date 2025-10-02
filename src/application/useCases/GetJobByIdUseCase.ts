import { Job, JobProps } from '@/domain/entities/Job'
import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobRepository } from '@/infrastructure/repositories/JobRepository'

/**
 * Output of the GetJobById use case
 */
export interface GetJobByIdOutput {
  success: boolean
  job?: Job
  error?: string
  isOwner?: boolean
  canEdit?: boolean
}

/**
 * Use case for retrieving a single job by ID
 */
export class GetJobByIdUseCase {
  private jobRepository: IJobRepository

  constructor(jobRepository?: IJobRepository) {
    this.jobRepository = jobRepository || new JobRepository()
  }

  /**
   * Execute the use case
   * @param jobId The ID of the job to retrieve
   * @param userId Optional user ID for permission checks
   * @returns The job details if found
   */
  async execute(jobId: string, userId?: string): Promise<GetJobByIdOutput> {
    try {
      // Validate job ID
      if (!jobId || typeof jobId !== 'string') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }

      // Validate job ID format (assuming UUID)
      if (!this.isValidJobId(jobId)) {
        return {
          success: false,
          error: 'Invalid job ID format'
        }
      }

      // Fetch the job from repository
      const job = await this.jobRepository.findById(jobId)

      if (!job) {
        return {
          success: false,
          error: 'Job not found'
        }
      }

      // Check if the current user is the owner
      const isOwner = userId ? job.getUserId() === userId : false

      // Determine if user can edit this job
      const canEdit = isOwner && this.canJobBeEdited(job)

      // Track view for analytics (only for non-owners)
      if (!isOwner) {
        await this.trackJobView(job, userId)
      }

      // Enhance job data
      const enhancedJob = await this.enhanceJobDetails(job, userId)

      return {
        success: true,
        job: enhancedJob,
        isOwner,
        canEdit
      }
    } catch (error) {
      console.error('Error fetching job by ID:', error)

      return {
        success: false,
        error: error instanceof Error
          ? `Failed to fetch job: ${error.message}`
          : 'An unexpected error occurred while fetching the job'
      }
    }
  }

  /**
   * Get multiple jobs by IDs
   * @param jobIds Array of job IDs
   * @param userId Optional user ID for permission checks
   * @returns Array of job details
   */
  async getMultipleJobs(
    jobIds: string[],
    userId?: string
  ): Promise<{ jobs: Job[]; errors: Record<string, string> }> {
    const jobs: Job[] = []
    const errors: Record<string, string> = {}

    for (const jobId of jobIds) {
      const result = await this.execute(jobId, userId)
      if (result.success && result.job) {
        jobs.push(result.job)
      } else {
        errors[jobId] = result.error || 'Unknown error'
      }
    }

    return { jobs, errors }
  }

  /**
   * Get job with related data (e.g., similar jobs)
   * @param jobId The job ID
   * @param userId Optional user ID
   * @returns Job with related data
   */
  async getJobWithRelated(
    jobId: string,
    userId?: string
  ): Promise<{
    job?: Job
    related?: Job[]
    error?: string
  }> {
    const result = await this.execute(jobId, userId)

    if (!result.success || !result.job) {
      return { error: result.error }
    }

    // Find related jobs
    const related = await this.findRelatedJobs(result.job)

    return {
      job: result.job,
      related
    }
  }

  /**
   * Validate job ID format
   * @param jobId The job ID to validate
   * @returns True if valid
   */
  private isValidJobId(jobId: string): boolean {
    // UUID v4 format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    // Also accept simple alphanumeric IDs for flexibility
    const simpleIdRegex = /^[a-zA-Z0-9_-]+$/

    return uuidRegex.test(jobId) || simpleIdRegex.test(jobId)
  }

  /**
   * Check if a job can be edited
   * @param job The job to check
   * @returns True if job can be edited
   */
  private canJobBeEdited(job: Job): boolean {
    // Business rules for editability:
    // 1. Job must be less than 90 days old
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    if (job.getCreatedAt() < ninetyDaysAgo) {
      return false
    }

    // 2. Additional rules could be added here
    // - Job status (if we had a status field)
    // - Number of applications received
    // - Payment status for paid listings

    return true
  }

  /**
   * Track job view for analytics
   * @param job The viewed job
   * @param userId The viewing user (if authenticated)
   */
  private async trackJobView(job: Job, userId?: string): Promise<void> {
    // In a production system, this would:
    // 1. Store view in analytics database
    // 2. Update view counter
    // 3. Track user behavior for recommendations

    const viewData = {
      jobId: job.getId(),
      jobTitle: job.getTitle(),
      company: job.getCompany(),
      viewedAt: new Date(),
      viewerId: userId || 'anonymous',
      referrer: 'direct', // Would get from request headers
      deviceType: 'unknown' // Would detect from user agent
    }

    console.log('Job view tracked:', viewData)

    // Update view count in cache
    await this.incrementViewCount(job.getId())
  }

  /**
   * Increment view count for a job
   * @param jobId The job ID
   */
  private async incrementViewCount(jobId: string): Promise<void> {
    // In production, this would update a cache or database
    // Could use Redis INCR command for atomic increment
    console.log('Incrementing view count for job:', jobId)
  }

  /**
   * Enhance job details with additional information
   * @param job The base job data
   * @param userId The requesting user ID
   * @returns Enhanced job data
   */
  private async enhanceJobDetails(job: Job, userId?: string): Promise<Job> {
    // In a real system, you might add:
    // 1. Company information and logo
    // 2. Application count
    // 3. Whether current user has applied
    // 4. Calculated fields (days since posted, etc.)
    // 5. Formatted salary range
    // 6. Benefits and perks

    // Add time-based calculations
    const now = new Date()
    const daysAgo = Math.floor(
      (now.getTime() - job.getCreatedAt().getTime()) / (1000 * 60 * 60 * 24)
    )

    // Add metadata (this would normally be separate fields)
    console.log('Job metadata:', {
      daysAgo,
      isNew: daysAgo <= 7,
      isUrgent: daysAgo >= 30, // Older jobs might be more urgent to fill
    })

    return job
  }

  /**
   * Find jobs related to the given job
   * @param job The reference job
   * @returns Array of related jobs
   */
  private async findRelatedJobs(job: Job): Promise<Job[]> {
    try {
      // Find jobs with similar criteria
      const filters = {
        // Same location
        location: job.getLocation(),
        // Same job type
        jobType: job.getJobType()
      }

      const result = await this.jobRepository.findAll(
        filters,
        {
          page: 1,
          limit: 5,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )

      // Filter out the current job
      return result.data.filter(j => j.getId() !== job.getId())
    } catch (error) {
      console.error('Error finding related jobs:', error)
      return []
    }
  }

  /**
   * Get job preview (limited data for listings)
   * @param jobId The job ID
   * @returns Limited job data for preview
   */
  async getJobPreview(jobId: string): Promise<{
    success: boolean
    preview?: Partial<JobProps>
    error?: string
  }> {
    const result = await this.execute(jobId)

    if (!result.success || !result.job) {
      return { success: false, error: result.error }
    }

    // Return only preview fields
    return {
      success: true,
      preview: {
        id: result.job.getId(),
        title: result.job.getTitle(),
        company: result.job.getCompany(),
        location: result.job.getLocation(),
        jobType: result.job.getJobType(),
        createdAt: result.job.getCreatedAt(),
        // Truncated description for preview
        description: result.job.getDescription().substring(0, 200) + '...'
      }
    }
  }
}