import { GetJobByIdUseCase } from '../GetJobByIdUseCase'
import { IJobRepository, PaginatedResult } from '@/infrastructure/repositories/interfaces'
import { JobType } from '@/domain/valueObjects/JobType'
import { Job } from '@/domain/entities/Job'

describe('GetJobByIdUseCase', () => {
  let useCase: GetJobByIdUseCase
  let mockRepository: jest.Mocked<IJobRepository>

  const createMockJob = (id: string, overrides?: Partial<Job>): Job => ({
    id,
    title: `Job ${id}`,
    company: `Company ${id}`,
    description: `Description for job ${id}`,
    location: `Location ${id}`,
    jobType: JobType.FULL_TIME,
    userId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  })

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
    useCase = new GetJobByIdUseCase(mockRepository)
  })

  describe('execute', () => {
    const jobId = 'job123'
    const userId = 'user123'

    it('should fetch job by ID successfully', async () => {
      const mockJob = createMockJob(jobId, { userId })
      mockRepository.findById.mockResolvedValue(mockJob)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(mockJob)
      expect(result.isOwner).toBe(true)
      expect(result.canEdit).toBe(true)
      expect(mockRepository.findById).toHaveBeenCalledWith(jobId)
    })

    it('should identify non-owner correctly', async () => {
      const mockJob = createMockJob(jobId, { userId: 'anotherUser' })
      mockRepository.findById.mockResolvedValue(mockJob)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(mockJob)
      expect(result.isOwner).toBe(false)
      expect(result.canEdit).toBe(false)
    })

    it('should handle anonymous users', async () => {
      const mockJob = createMockJob(jobId)
      mockRepository.findById.mockResolvedValue(mockJob)

      const result = await useCase.execute(jobId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(mockJob)
      expect(result.isOwner).toBe(false)
      expect(result.canEdit).toBe(false)
    })

    it('should fail with invalid job ID', async () => {
      const result = await useCase.execute('', userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid job ID provided')
      expect(mockRepository.findById).not.toHaveBeenCalled()
    })

    it('should fail with invalid job ID format', async () => {
      const result = await useCase.execute('invalid!@#$', userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid job ID format')
      expect(mockRepository.findById).not.toHaveBeenCalled()
    })

    it('should accept UUID format job IDs', async () => {
      const uuidJobId = '550e8400-e29b-41d4-a716-446655440000'
      const mockJob = createMockJob(uuidJobId)
      mockRepository.findById.mockResolvedValue(mockJob)

      const result = await useCase.execute(uuidJobId)

      expect(result.success).toBe(true)
      expect(mockRepository.findById).toHaveBeenCalledWith(uuidJobId)
    })

    it('should accept alphanumeric job IDs', async () => {
      const alphanumericId = 'job_123-ABC'
      const mockJob = createMockJob(alphanumericId)
      mockRepository.findById.mockResolvedValue(mockJob)

      const result = await useCase.execute(alphanumericId)

      expect(result.success).toBe(true)
      expect(mockRepository.findById).toHaveBeenCalledWith(alphanumericId)
    })

    it('should fail when job not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Job not found')
    })

    it('should not allow edit for jobs older than 90 days', async () => {
      const ninetyOneDaysAgo = new Date()
      ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91)

      const oldJob = createMockJob(jobId, {
        userId,
        createdAt: ninetyOneDaysAgo
      })
      mockRepository.findById.mockResolvedValue(oldJob)

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(true)
      expect(result.isOwner).toBe(true)
      expect(result.canEdit).toBe(false)
    })

    it('should track view for non-owners', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockJob = createMockJob(jobId, { userId: 'anotherUser' })
      mockRepository.findById.mockResolvedValue(mockJob)

      await useCase.execute(jobId, userId)

      expect(consoleSpy).toHaveBeenCalledWith(
        'Job view tracked:',
        expect.objectContaining({
          jobId,
          viewerId: userId
        })
      )

      consoleSpy.mockRestore()
    })

    it('should not track view for owners', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()
      const mockJob = createMockJob(jobId, { userId })
      mockRepository.findById.mockResolvedValue(mockJob)

      await useCase.execute(jobId, userId)

      expect(consoleSpy).not.toHaveBeenCalledWith(
        'Job view tracked:',
        expect.any(Object)
      )

      consoleSpy.mockRestore()
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(jobId, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch job: Database error')
    })
  })

  describe('getMultipleJobs', () => {
    it('should fetch multiple jobs successfully', async () => {
      const job1 = createMockJob('job1')
      const job2 = createMockJob('job2')

      mockRepository.findById
        .mockResolvedValueOnce(job1)
        .mockResolvedValueOnce(job2)
        .mockResolvedValueOnce(null) // job3 not found

      const result = await useCase.getMultipleJobs(['job1', 'job2', 'job3'], 'user123')

      expect(result.jobs).toHaveLength(2)
      expect(result.jobs).toContainEqual(job1)
      expect(result.jobs).toContainEqual(job2)
      expect(result.errors).toEqual({
        job3: 'Job not found'
      })
    })
  })

  describe('getJobWithRelated', () => {
    it('should fetch job with related jobs', async () => {
      const mainJob = createMockJob('job1', {
        location: 'New York, NY',
        jobType: JobType.FULL_TIME
      })
      const relatedJob = createMockJob('job2', {
        location: 'New York, NY',
        jobType: JobType.FULL_TIME
      })

      mockRepository.findById.mockResolvedValue(mainJob)
      mockRepository.findAll.mockResolvedValue({
        data: [mainJob, relatedJob],
        total: 2,
        page: 1,
        limit: 5,
        hasMore: false
      })

      const result = await useCase.getJobWithRelated('job1', 'user123')

      expect(result.job).toEqual(mainJob)
      expect(result.related).toEqual([relatedJob])
      expect(result.error).toBeUndefined()
    })

    it('should return error when job not found', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.getJobWithRelated('nonexistent', 'user123')

      expect(result.error).toBe('Job not found')
      expect(result.job).toBeUndefined()
      expect(result.related).toBeUndefined()
    })

    it('should handle errors in finding related jobs', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const mainJob = createMockJob('job1')

      mockRepository.findById.mockResolvedValue(mainJob)
      mockRepository.findAll.mockRejectedValue(new Error('Database error'))

      const result = await useCase.getJobWithRelated('job1', 'user123')

      expect(result.job).toEqual(mainJob)
      expect(result.related).toEqual([])
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error finding related jobs:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('getJobPreview', () => {
    it('should return limited job data for preview', async () => {
      const fullJob = createMockJob('job1', {
        description: 'A'.repeat(300) // Long description
      })

      mockRepository.findById.mockResolvedValue(fullJob)

      const result = await useCase.getJobPreview('job1')

      expect(result.success).toBe(true)
      expect(result.preview).toBeDefined()
      expect(result.preview?.description).toHaveLength(203) // 200 chars + '...'
      expect(result.preview?.description?.endsWith('...')).toBe(true)
    })

    it('should return error when job not found for preview', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.getJobPreview('nonexistent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Job not found')
      expect(result.preview).toBeUndefined()
    })
  })
})