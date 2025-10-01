import { Job } from '@/domain/entities/Job'
import { JobType } from '@/domain/valueObjects/JobType'
import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobRepository } from '@/infrastructure/repositories/JobRepository'
import { CreateJobSchema } from '@/lib/validations/job'
import { z } from 'zod'

/**
 * Input data for creating a job
 */
export type CreateJobInput = z.infer<typeof CreateJobSchema>

/**
 * Output of the CreateJob use case
 */
export interface CreateJobOutput {
  success: boolean
  job?: Job
  error?: string
  validationErrors?: Record<string, string[]>
}

/**
 * Use case for creating a new job posting
 */
export class CreateJobUseCase {
  private jobRepository: IJobRepository

  constructor(jobRepository?: IJobRepository) {
    this.jobRepository = jobRepository || new JobRepository()
  }

  /**
   * Execute the use case
   * @param input The job data to create
   * @param userId The ID of the user creating the job
   * @returns The result of the operation
   */
  async execute(input: CreateJobInput, userId: string): Promise<CreateJobOutput> {
    try {
      // Validate the user is authenticated
      if (!userId) {
        return {
          success: false,
          error: 'User must be authenticated to create a job'
        }
      }

      // Validate input data
      const validationResult = CreateJobSchema.safeParse(input)

      if (!validationResult.success) {
        const errors: Record<string, string[]> = {}
        validationResult.error.issues.forEach((issue) => {
          const field = issue.path.join('.')
          if (!errors[field]) {
            errors[field] = []
          }
          errors[field].push(issue.message)
        })

        return {
          success: false,
          error: 'Validation failed',
          validationErrors: errors
        }
      }

      const validatedData = validationResult.data

      // Business rule: Check if company name is not blacklisted
      if (this.isCompanyBlacklisted(validatedData.company)) {
        return {
          success: false,
          error: 'This company is not allowed to post jobs on our platform'
        }
      }

      // Business rule: Check for duplicate postings
      const isDuplicate = await this.checkForDuplicate(
        validatedData.title,
        validatedData.company,
        userId
      )

      if (isDuplicate) {
        return {
          success: false,
          error: 'A similar job posting from your company already exists. Please update the existing posting instead.'
        }
      }

      // Create the job
      const job = await this.jobRepository.create({
        title: validatedData.title,
        company: validatedData.company,
        description: validatedData.description,
        location: validatedData.location,
        jobType: validatedData.jobType as JobType,
        userId
      })

      // Log the creation for audit
      this.logJobCreation(job, userId)

      return {
        success: true,
        job
      }
    } catch (error) {
      console.error('Error creating job:', error)

      return {
        success: false,
        error: error instanceof Error
          ? `Failed to create job: ${error.message}`
          : 'An unexpected error occurred while creating the job'
      }
    }
  }

  /**
   * Check if a company is blacklisted
   * @param companyName The company name to check
   * @returns True if blacklisted
   */
  private isCompanyBlacklisted(companyName: string): boolean {
    // This would typically check against a database or external service
    const blacklist = [
      'spam company',
      'fake corp',
      'scam industries'
    ]

    return blacklist.some(blocked =>
      companyName.toLowerCase().includes(blocked.toLowerCase())
    )
  }

  /**
   * Check for duplicate job postings
   * @param title The job title
   * @param company The company name
   * @param userId The user ID
   * @returns True if a duplicate exists
   */
  private async checkForDuplicate(
    title: string,
    company: string,
    userId: string
  ): Promise<boolean> {
    try {
      // Check for exact match within the last 7 days
      const recentJobs = await this.jobRepository.findAll(
        { userId },
        {
          page: 1,
          limit: 100,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      return recentJobs.data.some(job =>
        job.title.toLowerCase() === title.toLowerCase() &&
        job.company.toLowerCase() === company.toLowerCase() &&
        job.createdAt > sevenDaysAgo
      )
    } catch (error) {
      console.error('Error checking for duplicates:', error)
      // Don't block creation if duplicate check fails
      return false
    }
  }

  /**
   * Log job creation for audit purposes
   * @param job The created job
   * @param userId The user who created it
   */
  private logJobCreation(job: Job, userId: string): void {
    // In a production system, this would send to a logging service
    console.log('Job created:', {
      jobId: job.id,
      title: job.title,
      company: job.company,
      userId,
      createdAt: job.createdAt
    })
  }

  /**
   * Validate that the user has permission to create jobs
   * This could check user role, subscription status, etc.
   * @param userId The user ID
   * @returns True if user can create jobs
   */
  async canUserCreateJobs(userId: string): Promise<boolean> {
    // For now, all authenticated users can create jobs
    // In the future, this could check:
    // - User role (employer vs job seeker)
    // - Subscription status
    // - Rate limiting (max jobs per day/month)
    return true
  }
}