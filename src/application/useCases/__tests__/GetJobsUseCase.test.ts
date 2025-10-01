import { GetJobsUseCase } from '../GetJobsUseCase'
import { IJobRepository, PaginatedResult } from '@/infrastructure/repositories/interfaces'
import { JobType } from '@/domain/valueObjects/JobType'
import { Job } from '@/domain/entities/Job'

describe('GetJobsUseCase', () => {
  let useCase: GetJobsUseCase
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

  const createPaginatedResult = (jobs: Job[], page = 1, limit = 20): PaginatedResult<Job> => ({
    data: jobs,
    total: jobs.length,
    page,
    limit,
    hasMore: false
  })

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    }
    useCase = new GetJobsUseCase(mockRepository)
  })

  describe('execute', () => {
    it('should fetch jobs with default parameters', async () => {
      const mockJobs = [createMockJob('1'), createMockJob('2')]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        {
          page: 1,
          limit: 20,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )
    })

    it('should fetch jobs with location filter', async () => {
      const mockJobs = [createMockJob('1', { location: 'New York, NY' })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute({ location: 'New York, NY' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { location: 'New York, NY' },
        expect.any(Object)
      )
    })

    it('should fetch jobs with job type filter', async () => {
      const mockJobs = [createMockJob('1', { jobType: JobType.REMOTE })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute({ jobType: JobType.REMOTE })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { jobType: JobType.REMOTE },
        expect.any(Object)
      )
    })

    it('should fetch jobs with search term', async () => {
      const mockJobs = [createMockJob('1', { title: 'Senior Developer' })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute({ searchTerm: 'developer' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { searchTerm: 'developer' },
        expect.any(Object)
      )
    })

    it('should fetch jobs for specific user', async () => {
      const userId = 'user456'
      const mockJobs = [createMockJob('1', { userId })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute({ userId })

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { userId },
        expect.any(Object)
      )
    })

    it('should handle pagination parameters', async () => {
      const mockJobs = [createMockJob('1'), createMockJob('2')]
      const paginatedResult = createPaginatedResult(mockJobs, 2, 10)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute({ page: 2, limit: 10 })

      expect(result.success).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        {
          page: 2,
          limit: 10,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )
    })

    it('should validate and correct invalid page number', async () => {
      const paginatedResult = createPaginatedResult([])
      mockRepository.findAll.mockResolvedValue(paginatedResult)

      await useCase.execute({ page: -1 })

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ page: 1 })
      )
    })

    it('should enforce maximum page size', async () => {
      const paginatedResult = createPaginatedResult([])
      mockRepository.findAll.mockResolvedValue(paginatedResult)

      await useCase.execute({ limit: 200 })

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        expect.objectContaining({ limit: 100 })
      )
    })

    it('should sanitize search terms', async () => {
      const paginatedResult = createPaginatedResult([])
      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.execute({
        searchTerm: 'developer<script>alert("xss")</script>'
      })

      expect(result.success).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { searchTerm: 'developerscriptalertxssscript' },
        expect.any(Object)
      )
    })

    it('should reject invalid job type', async () => {
      const result = await useCase.execute({ jobType: 'INVALID_TYPE' as JobType })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid job type specified')
      expect(mockRepository.findAll).not.toHaveBeenCalled()
    })

    it('should reject invalid order by field', async () => {
      const result = await useCase.execute({
        orderBy: 'invalidField' as any
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid order by field')
      expect(mockRepository.findAll).not.toHaveBeenCalled()
    })

    it('should handle repository errors gracefully', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'))

      const result = await useCase.execute()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch jobs: Database error')
    })
  })

  describe('getFeaturedJobs', () => {
    it('should fetch featured jobs', async () => {
      const mockJobs = [createMockJob('1'), createMockJob('2')]
      const paginatedResult = createPaginatedResult(mockJobs, 1, 5)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.getFeaturedJobs(5)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(paginatedResult)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {},
        {
          page: 1,
          limit: 5,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )
    })

    it('should handle errors in featured jobs', async () => {
      mockRepository.findAll.mockRejectedValue(new Error('Database error'))

      const result = await useCase.getFeaturedJobs()

      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to fetch featured jobs')
    })
  })

  describe('getJobsByLocation', () => {
    it('should fetch jobs by location', async () => {
      const location = 'San Francisco, CA'
      const mockJobs = [createMockJob('1', { location })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.getJobsByLocation(location)

      expect(result.success).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { location },
        expect.objectContaining({ limit: 20 })
      )
    })
  })

  describe('getJobsByType', () => {
    it('should fetch jobs by type', async () => {
      const jobType = JobType.REMOTE
      const mockJobs = [createMockJob('1', { jobType })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.getJobsByType(jobType)

      expect(result.success).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { jobType },
        expect.objectContaining({ limit: 20 })
      )
    })
  })

  describe('searchJobs', () => {
    it('should search jobs by keyword', async () => {
      const searchTerm = 'developer'
      const mockJobs = [createMockJob('1', { title: 'Senior Developer' })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.searchJobs(searchTerm, 2, 30)

      expect(result.success).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { searchTerm },
        expect.objectContaining({ page: 2, limit: 30 })
      )
    })
  })

  describe('getUserJobs', () => {
    it('should fetch user jobs', async () => {
      const userId = 'user123'
      const mockJobs = [createMockJob('1', { userId })]
      const paginatedResult = createPaginatedResult(mockJobs)

      mockRepository.findAll.mockResolvedValue(paginatedResult)

      const result = await useCase.getUserJobs(userId)

      expect(result.success).toBe(true)
      expect(mockRepository.findAll).toHaveBeenCalledWith(
        { userId },
        expect.objectContaining({
          orderBy: 'createdAt',
          orderDirection: 'desc'
        })
      )
    })

    it('should fail when user ID is not provided', async () => {
      const result = await useCase.getUserJobs('')

      expect(result.success).toBe(false)
      expect(result.error).toBe('User ID is required')
      expect(mockRepository.findAll).not.toHaveBeenCalled()
    })
  })
})