import { UpdateJobUseCase } from '../UpdateJobUseCase'
import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobType } from '@/domain/valueObjects/JobType'
import { Job } from '@/domain/entities/Job'

describe('UpdateJobUseCase', () => {
  let useCase: UpdateJobUseCase
  let mockRepository: jest.Mocked<IJobRepository>

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
    useCase = new UpdateJobUseCase(mockRepository)
  })

  describe('execute', () => {
    const jobId = 'job123'
    const userId = 'user123'
    const validInput = {
      title: 'Updated Senior Developer',
      company: 'Tech Corp',
      description: 'Updated description with more details about the position.',
      location: 'San Francisco, CA',
      jobType: JobType.REMOTE
    }

    const existingJob: Job = {
      id: jobId,
      title: 'Senior Developer',
      company: 'Tech Corp',
      description: 'Original description',
      location: 'New York, NY',
      jobType: JobType.FULL_TIME,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    it('should update a job successfully with valid input', async () => {
      const updatedJob: Job = {
        ...existingJob,
        ...validInput,
        updatedAt: new Date()
      }

      mockRepository.findById.mockResolvedValue(existingJob)
      mockRepository.update.mockResolvedValue(updatedJob)

      const result = await useCase.execute(jobId, validInput, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(updatedJob)
      expect(result.error).toBeUndefined()
      expect(mockRepository.update).toHaveBeenCalledWith(jobId, validInput)
    })

    it('should fail when user is not authenticated', async () => {
      const result = await useCase.execute(jobId, validInput, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User must be authenticated to update a job')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should fail with invalid job ID', async () => {
      const result = await useCase.execute('', validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid job ID provided')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when job does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null)

      const result = await useCase.execute(jobId, validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Job not found')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when user is not the owner', async () => {
      const jobWithDifferentOwner = {
        ...existingJob,
        userId: 'differentUser'
      }
      mockRepository.findById.mockResolvedValue(jobWithDifferentOwner)

      const result = await useCase.execute(jobId, validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('You do not have permission to update this job')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should fail when job is older than 90 days', async () => {
      const ninetyOneDaysAgo = new Date()
      ninetyOneDaysAgo.setDate(ninetyOneDaysAgo.getDate() - 91)

      const oldJob = {
        ...existingJob,
        createdAt: ninetyOneDaysAgo
      }
      mockRepository.findById.mockResolvedValue(oldJob)

      const result = await useCase.execute(jobId, validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Jobs older than 90 days cannot be edited. Please create a new posting instead.')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should fail with validation errors for invalid input', async () => {
      mockRepository.findById.mockResolvedValue(existingJob)

      const invalidInput = {
        title: 'a', // Too short
        company: '', // Empty
        description: 'short', // Too short
        location: '',
        jobType: 'INVALID' as JobType
      }

      const result = await useCase.execute(jobId, invalidInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.validationErrors).toBeDefined()
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should reject blacklisted companies', async () => {
      mockRepository.findById.mockResolvedValue(existingJob)

      const blacklistedInput = {
        ...validInput,
        company: 'Scam Industries'
      }

      const result = await useCase.execute(jobId, blacklistedInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('This company is not allowed to post jobs on our platform')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should prevent company name change after 24 hours', async () => {
      const twentyFiveHoursAgo = new Date()
      twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25)

      const dayOldJob = {
        ...existingJob,
        createdAt: twentyFiveHoursAgo
      }
      mockRepository.findById.mockResolvedValue(dayOldJob)

      const inputWithCompanyChange = {
        ...validInput,
        company: 'Different Company'
      }

      const result = await useCase.execute(jobId, inputWithCompanyChange, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Company name cannot be changed after 24 hours of posting')
      expect(mockRepository.update).not.toHaveBeenCalled()
    })

    it('should allow company name change within 24 hours', async () => {
      const tenHoursAgo = new Date()
      tenHoursAgo.setHours(tenHoursAgo.getHours() - 10)

      const recentJob = {
        ...existingJob,
        createdAt: tenHoursAgo
      }
      mockRepository.findById.mockResolvedValue(recentJob)

      const inputWithCompanyChange = {
        ...validInput,
        company: 'Different Company'
      }

      const updatedJob: Job = {
        ...recentJob,
        ...inputWithCompanyChange,
        updatedAt: new Date()
      }
      mockRepository.update.mockResolvedValue(updatedJob)

      const result = await useCase.execute(jobId, inputWithCompanyChange, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(updatedJob)
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.findById.mockResolvedValue(existingJob)
      mockRepository.update.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(jobId, validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to update job: Database error')
    })

    it('should handle partial updates', async () => {
      const partialInput = {
        title: 'New Title Only'
      }

      const updatedJob: Job = {
        ...existingJob,
        title: partialInput.title,
        updatedAt: new Date()
      }

      mockRepository.findById.mockResolvedValue(existingJob)
      mockRepository.update.mockResolvedValue(updatedJob)

      const result = await useCase.execute(jobId, partialInput, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(updatedJob)
      expect(mockRepository.update).toHaveBeenCalledWith(jobId, { title: partialInput.title })
    })
  })

  describe('canJobBeUpdated', () => {
    it('should return true for valid jobs', async () => {
      const job: Job = {
        id: 'job123',
        title: 'Test Job',
        company: 'Test Corp',
        description: 'Test description',
        location: 'Test Location',
        jobType: JobType.FULL_TIME,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const result = await useCase.canJobBeUpdated(job)
      expect(result).toBe(true)
    })
  })
})