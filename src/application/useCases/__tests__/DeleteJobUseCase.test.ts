import { DeleteJobUseCase } from '../DeleteJobUseCase'
import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobType } from '@/domain/valueObjects/JobType'
import { Job } from '@/domain/entities/Job'

describe('DeleteJobUseCase', () => {
  let useCase: DeleteJobUseCase
  let mockRepository: jest.Mocked<IJobRepository>

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
    useCase = new DeleteJobUseCase(mockRepository)
  })

  describe('execute', () => {
    const jobId = 'job123'
    const userId = 'user123'

    const existingJob: Job = {
      id: jobId,
      title: 'Senior Developer',
      company: 'Tech Corp',
      description: 'Job description',
      location: 'New York, NY',
      jobType: JobType.FULL_TIME,
      userId,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day old
      updatedAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour old
    }

    it('should delete a job successfully', async () => {
      mockRepository.findById.mockResolvedValue(existingJob)
      mockRepository.delete.mockResolvedValue(true)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
      expect(mockRepository.delete).toHaveBeenCalledWith(jobId)
    })

    it('should fail when user is not authenticated', async () => {
      const result = await useCase.execute(jobId, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User must be authenticated to delete a job')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should fail with invalid job ID', async () => {
      const result = await useCase.execute('', userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid job ID provided')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should fail when job does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Job not found')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should fail when user is not the owner', async () => {
      const jobWithDifferentOwner = {
        ...existingJob,
        userId: 'differentUser'
      }
      mockRepository.findById.mockResolvedValue(jobWithDifferentOwner)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('You do not have permission to delete this job')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should prevent deletion of recently updated jobs', async () => {
      const recentlyUpdatedJob = {
        ...existingJob,
        updatedAt: new Date() // Just updated
      }
      mockRepository.findById.mockResolvedValue(recentlyUpdatedJob)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('This job was recently updated. Please wait a few minutes before deleting to prevent accidental deletion.')
      expect(mockRepository.delete).not.toHaveBeenCalled()
    })

    it('should allow force delete regardless of recent updates', async () => {
      const recentlyUpdatedJob = {
        ...existingJob,
        updatedAt: new Date() // Just updated
      }
      mockRepository.findById.mockResolvedValue(recentlyUpdatedJob)
      mockRepository.delete.mockResolvedValue(true)

      const result = await useCase.execute(jobId, userId, true) // Force delete

      expect(result.success).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(jobId)
    })

    it('should allow admin to delete any job with force delete', async () => {
      const jobWithDifferentOwner = {
        ...existingJob,
        userId: 'differentUser'
      }
      mockRepository.findById.mockResolvedValue(jobWithDifferentOwner)
      mockRepository.delete.mockResolvedValue(true)

      const result = await useCase.execute(jobId, 'adminUser', true) // Force delete as admin

      expect(result.success).toBe(true)
      expect(mockRepository.delete).toHaveBeenCalledWith(jobId)
    })

    it('should handle deletion failure', async () => {
      mockRepository.findById.mockResolvedValue(existingJob)
      mockRepository.delete.mockResolvedValue(false)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete the job. Please try again.')
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockResolvedValue(existingJob)
      mockRepository.delete.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to delete job: Database error')
    })

    it('should log warning for recently created jobs', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const recentJob = {
        ...existingJob,
        createdAt: new Date() // Just created
      }
      mockRepository.findById.mockResolvedValue(recentJob)
      mockRepository.delete.mockResolvedValue(true)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(true)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Deleting recently created job:',
        expect.objectContaining({
          jobId,
          title: recentJob.title
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('isUserAdmin', () => {
    it('should return false for all users (no admin system yet)', async () => {
      const result = await useCase.isUserAdmin('anyUserId')
      expect(result).toBe(false)
    })
  })

  describe('bulkDelete', () => {
    it('should throw error for non-admin users', async () => {
      jest.spyOn(useCase, 'isUserAdmin').mockResolvedValue(false)

      await expect(useCase.bulkDelete(['job1', 'job2'], 'regularUser'))
        .rejects.toThrow('Only administrators can perform bulk deletions')
    })

    it('should process bulk deletion for admin users', async () => {
      jest.spyOn(useCase, 'isUserAdmin').mockResolvedValue(true)

      const job1: Job = {
        id: 'job1',
        title: 'Job 1',
        company: 'Company 1',
        description: 'Description 1',
        location: 'Location 1',
        jobType: JobType.FULL_TIME,
        userId: 'user1',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const job2: Job = {
        id: 'job2',
        title: 'Job 2',
        company: 'Company 2',
        description: 'Description 2',
        location: 'Location 2',
        jobType: JobType.REMOTE,
        userId: 'user2',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockRepository.findById
        .mockResolvedValueOnce(job1)
        .mockResolvedValueOnce(job2)
        .mockResolvedValueOnce(null) // job3 doesn't exist

      mockRepository.delete
        .mockResolvedValueOnce(true) // job1 deleted
        .mockResolvedValueOnce(true) // job2 deleted

      const result = await useCase.bulkDelete(['job1', 'job2', 'job3'], 'adminUser')

      expect(result.succeeded).toEqual(['job1', 'job2'])
      expect(result.failed).toEqual(['job3'])
    })
  })
})