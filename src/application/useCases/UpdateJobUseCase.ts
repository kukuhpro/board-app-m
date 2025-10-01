import { Job } from '@/domain/entities/Job'
import { JobType } from '@/domain/valueObjects/JobType'
import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobRepository } from '@/infrastructure/repositories/JobRepository'
import { UpdateJobSchema } from '@/lib/validations/job'
import { z } from 'zod'

/**
 * Input data for updating a job
 */
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>

/**
 * Output of the UpdateJob use case
 */
export interface UpdateJobOutput {
  success: boolean
  job?: Job
  error?: string
  validationErrors?: Record<string, string[]>
}

/**
 * Use case for updating an existing job posting
 */
export class UpdateJobUseCase {
  private jobRepository: IJobRepository

  constructor(jobRepository?: IJobRepository) {
    this.jobRepository = jobRepository || new JobRepository()
  }

  /**
   * Execute the use case
   * @param jobId The ID of the job to update
   * @param input The updated job data
   * @param userId The ID of the user requesting the update
   * @returns The result of the operation
   */
  async execute(
    jobId: string,
    input: UpdateJobInput,
    userId: string
  ): Promise<UpdateJobOutput> {
    try {
      // Validate the user is authenticated
      if (!userId) {
        return {
          success: false,
          error: 'User must be authenticated to update a job'
        }
      }

      // Validate job ID
      if (!jobId || typeof jobId !== 'string') {
        return {
          success: false,
          error: 'Invalid job ID provided'
        }
      }

      // Check if the job exists
      const existingJob = await this.jobRepository.findById(jobId)

      if (!existingJob) {
        return {
          success: false,
          error: 'Job not found'
        }
      }

      // Verify ownership - only the creator can update the job
      if (existingJob.userId !== userId) {
        return {
          success: false,
          error: 'You do not have permission to update this job'
        }
      }

      // Check if job is too old to edit (business rule: no edits after 90 days)
      const ninetyDaysAgo = new Date()
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

      if (existingJob.createdAt < ninetyDaysAgo) {
        return {
          success: false,
          error: 'Jobs older than 90 days cannot be edited. Please create a new posting instead.'
        }
      }

      // Validate input data
      const validationResult = UpdateJobSchema.safeParse(input)

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

      // Business rule: Check if company name is being changed and validate
      if (validatedData.company && validatedData.company !== existingJob.company) {
        if (this.isCompanyBlacklisted(validatedData.company)) {
          return {
            success: false,
            error: 'This company is not allowed to post jobs on our platform'
          }
        }

        // Additional validation for company change
        if (!this.canChangeCompany(existingJob)) {
          return {
            success: false,
            error: 'Company name cannot be changed after 24 hours of posting'
          }
        }
      }

      // Prepare update data
      const updateData: Partial<Omit<Job, 'id' | 'createdAt' | 'updatedAt'>> = {}

      if (validatedData.title !== undefined) {
        updateData.title = validatedData.title
      }
      if (validatedData.company !== undefined) {
        updateData.company = validatedData.company
      }
      if (validatedData.description !== undefined) {
        updateData.description = validatedData.description
      }
      if (validatedData.location !== undefined) {
        updateData.location = validatedData.location
      }
      if (validatedData.jobType !== undefined) {
        updateData.jobType = validatedData.jobType as JobType
      }

      // Update the job
      const updatedJob = await this.jobRepository.update(jobId, updateData)

      // Log the update for audit
      this.logJobUpdate(existingJob, updatedJob, userId)

      return {
        success: true,
        job: updatedJob
      }
    } catch (error) {
      console.error('Error updating job:', error)

      return {
        success: false,
        error: error instanceof Error
          ? `Failed to update job: ${error.message}`
          : 'An unexpected error occurred while updating the job'
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
   * Check if company name can be changed
   * @param job The existing job
   * @returns True if company can be changed
   */
  private canChangeCompany(job: Job): boolean {
    // Business rule: Company can only be changed within 24 hours of creation
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    return job.createdAt > twentyFourHoursAgo
  }

  /**
   * Log job update for audit purposes
   * @param oldJob The job before update
   * @param newJob The job after update
   * @param userId The user who updated it
   */
  private logJobUpdate(oldJob: Job, newJob: Job, userId: string): void {
    const changes: Record<string, { old: any; new: any }> = {}

    // Track what changed
    if (oldJob.title !== newJob.title) {
      changes.title = { old: oldJob.title, new: newJob.title }
    }
    if (oldJob.company !== newJob.company) {
      changes.company = { old: oldJob.company, new: newJob.company }
    }
    if (oldJob.description !== newJob.description) {
      changes.description = {
        old: oldJob.description.substring(0, 100) + '...',
        new: newJob.description.substring(0, 100) + '...'
      }
    }
    if (oldJob.location !== newJob.location) {
      changes.location = { old: oldJob.location, new: newJob.location }
    }
    if (oldJob.jobType !== newJob.jobType) {
      changes.jobType = { old: oldJob.jobType, new: newJob.jobType }
    }

    // In a production system, this would send to a logging service
    console.log('Job updated:', {
      jobId: newJob.id,
      userId,
      updatedAt: newJob.updatedAt,
      changes
    })
  }

  /**
   * Check if a job can be updated based on its status
   * @param job The job to check
   * @returns True if the job can be updated
   */
  async canJobBeUpdated(job: Job): Promise<boolean> {
    // Business rules for when a job can be updated:
    // 1. Not older than 90 days (checked in execute)
    // 2. Could check if job is "active" vs "filled" status in the future
    // 3. Could check if there are pending applications
    return true
  }
}