import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobRepository } from '@/infrastructure/repositories/JobRepository'

/**
 * Output of the DeleteJob use case
 */
export interface DeleteJobOutput {
  success: boolean
  error?: string
}

/**
 * Use case for deleting a job posting
 */
export class DeleteJobUseCase {
  private jobRepository: IJobRepository

  constructor(jobRepository?: IJobRepository) {
    this.jobRepository = jobRepository || new JobRepository()
  }

  /**
   * Execute the use case
   * @param jobId The ID of the job to delete
   * @param userId The ID of the user requesting the deletion
   * @param forceDelete Whether to force delete (admin only)
   * @returns The result of the operation
   */
  async execute(
    jobId: string,
    userId: string,
    forceDelete: boolean = false
  ): Promise<DeleteJobOutput> {
    try {
      // Validate the user is authenticated
      if (!userId) {
        return {
          success: false,
          error: 'User must be authenticated to delete a job'
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

      // Verify ownership - only the creator can delete the job (unless force delete by admin)
      if (!forceDelete && existingJob.getUserId() !== userId) {
        return {
          success: false,
          error: 'You do not have permission to delete this job'
        }
      }

      // Business rule: Warn if job was recently created
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      if (existingJob.getCreatedAt() > oneHourAgo && !forceDelete) {
        // In a real application, you might want to require additional confirmation
        console.warn('Deleting recently created job:', {
          jobId,
          createdAt: existingJob.getCreatedAt(),
          title: existingJob.getTitle()
        })
      }

      // Business rule: Check if job has been updated recently
      const lastUpdateThreshold = new Date()
      lastUpdateThreshold.setMinutes(lastUpdateThreshold.getMinutes() - 5)

      if (existingJob.getUpdatedAt() > lastUpdateThreshold && !forceDelete) {
        return {
          success: false,
          error: 'This job was recently updated. Please wait a few minutes before deleting to prevent accidental deletion.'
        }
      }

      // Create a soft delete record for audit (before actual deletion)
      this.createDeletionRecord(existingJob, userId, forceDelete)

      // Delete the job
      const deleted = await this.jobRepository.delete(jobId)

      if (!deleted) {
        return {
          success: false,
          error: 'Failed to delete the job. Please try again.'
        }
      }

      // Log the deletion for audit
      this.logJobDeletion(existingJob, userId, forceDelete)

      // Send notifications if needed
      await this.notifyDeletion(existingJob, userId)

      return {
        success: true
      }
    } catch (error) {
      console.error('Error deleting job:', error)

      return {
        success: false,
        error: error instanceof Error
          ? `Failed to delete job: ${error.message}`
          : 'An unexpected error occurred while deleting the job'
      }
    }
  }

  /**
   * Create a deletion record for audit purposes
   * In a real system, this would store the deleted job data
   * @param job The job being deleted
   * @param userId The user deleting it
   * @param forceDelete Whether it was a forced deletion
   */
  private createDeletionRecord(
    job: any,
    userId: string,
    forceDelete: boolean
  ): void {
    // In production, this would save to a separate audit table
    const deletionRecord = {
      jobId: job.id,
      jobData: {
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.jobType,
        description: job.description,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        originalUserId: job.userId
      },
      deletedBy: userId,
      deletedAt: new Date(),
      forceDelete,
      reason: forceDelete ? 'Admin force delete' : 'User requested deletion'
    }

    // Store this record (in production, this would be saved to database)
    console.log('Deletion record created:', deletionRecord)
  }

  /**
   * Log job deletion for audit purposes
   * @param job The deleted job
   * @param userId The user who deleted it
   * @param forceDelete Whether it was a forced deletion
   */
  private logJobDeletion(
    job: any,
    userId: string,
    forceDelete: boolean
  ): void {
    // In a production system, this would send to a logging service
    console.log('Job deleted:', {
      jobId: job.id,
      title: job.title,
      company: job.company,
      deletedBy: userId,
      deletedAt: new Date(),
      wasOwnJob: job.userId === userId,
      forceDelete
    })
  }

  /**
   * Send notifications about the deletion
   * @param job The deleted job
   * @param userId The user who deleted it
   */
  private async notifyDeletion(job: any, userId: string): Promise<void> {
    // In a production system, this might:
    // 1. Notify applicants that the job is no longer available
    // 2. Send confirmation email to the job poster
    // 3. Update any cached listings
    // 4. Remove from search indexes

    console.log('Deletion notifications:', {
      jobId: job.id,
      // Would send actual notifications here
      notificationTypes: [
        'email_confirmation',
        'applicant_notifications',
        'cache_invalidation'
      ]
    })
  }

  /**
   * Check if a user can delete any job (admin check)
   * @param userId The user ID to check
   * @returns True if user is an admin
   */
  async isUserAdmin(userId: string): Promise<boolean> {
    // In a real system, this would check user roles/permissions
    // For now, we'll return false (no admin users)
    return false
  }

  /**
   * Bulk delete jobs (admin only)
   * @param jobIds Array of job IDs to delete
   * @param adminUserId The admin user ID
   * @returns Results of the bulk deletion
   */
  async bulkDelete(
    jobIds: string[],
    adminUserId: string
  ): Promise<{ succeeded: string[]; failed: string[] }> {
    const isAdmin = await this.isUserAdmin(adminUserId)

    if (!isAdmin) {
      throw new Error('Only administrators can perform bulk deletions')
    }

    const succeeded: string[] = []
    const failed: string[] = []

    for (const jobId of jobIds) {
      const result = await this.execute(jobId, adminUserId, true)
      if (result.success) {
        succeeded.push(jobId)
      } else {
        failed.push(jobId)
      }
    }

    return { succeeded, failed }
  }
}