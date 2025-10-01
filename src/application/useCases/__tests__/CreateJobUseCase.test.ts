import { CreateJobUseCase } from '../CreateJobUseCase'
import { IJobRepository } from '@/infrastructure/repositories/interfaces'
import { JobType } from '@/domain/valueObjects/JobType'
import { Job } from '@/domain/entities/Job'

describe('CreateJobUseCase', () => {
  let useCase: CreateJobUseCase
  let mockRepository: jest.Mocked<IJobRepository>

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
    useCase = new CreateJobUseCase(mockRepository)
  })

  describe('execute', () => {
    const validInput = {
      title: 'Senior Developer',
      company: 'Tech Corp',
      description: 'We are looking for a senior developer with 5+ years of experience.',
      location: 'New York, NY',
      jobType: JobType.FULL_TIME
    }

    const userId = 'user123'

    it('should create a job successfully with valid input', async () => {
      const createdJob: Job = {
        id: 'job123',
        ...validInput,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockRepository.create.mockResolvedValue(createdJob)
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        hasMore: false
      })

      const result = await useCase.execute(validInput, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(createdJob)
      expect(result.error).toBeUndefined()
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...validInput,
        userId
      })
    })

    it('should fail when user is not authenticated', async () => {
      const result = await useCase.execute(validInput, '')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User must be authenticated to create a job')
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should fail with validation errors for invalid input', async () => {
      const invalidInput = {
        title: 'a', // Too short
        company: '', // Empty
        description: 'short', // Too short
        location: '',
        jobType: 'INVALID' as JobType
      }

      const result = await useCase.execute(invalidInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Validation failed')
      expect(result.validationErrors).toBeDefined()
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should reject blacklisted companies', async () => {
      const blacklistedInput = {
        ...validInput,
        company: 'Spam Company Ltd'
      }

      const result = await useCase.execute(blacklistedInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('This company is not allowed to post jobs on our platform')
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should detect duplicate job postings', async () => {
      const existingJob: Job = {
        id: 'existing123',
        ...validInput,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockRepository.findAll.mockResolvedValue({
        data: [existingJob],
        total: 1,
        page: 1,
        limit: 100,
        hasMore: false
      })

      const result = await useCase.execute(validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('A similar job posting from your company already exists. Please update the existing posting instead.')
      expect(mockRepository.create).not.toHaveBeenCalled()
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.findAll.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 100,
        hasMore: false
      })
      mockRepository.create.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute(validInput, userId)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to create job: Database error')
    })

    it('should allow job creation if duplicate check fails', async () => {
      const createdJob: Job = {
        id: 'job123',
        ...validInput,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockRepository.findAll.mockRejectedValue(new Error('Database error'))
      mockRepository.create.mockResolvedValue(createdJob)

      const result = await useCase.execute(validInput, userId)

      expect(result.success).toBe(true)
      expect(result.job).toEqual(createdJob)
    })
  })

  describe('canUserCreateJobs', () => {
    it('should return true for any authenticated user', async () => {
      const result = await useCase.canUserCreateJobs('user123')
      expect(result).toBe(true)
    })
  })
})