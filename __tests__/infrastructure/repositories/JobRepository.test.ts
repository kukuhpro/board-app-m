import { JobRepository } from '@/infrastructure/repositories/JobRepository'
import { SupabaseAdapter } from '@/infrastructure/adapters/SupabaseAdapter'
import { Job } from '@/domain/entities/Job'
import { JobType } from '@/domain/valueObjects/JobType'
import { createClient } from '@supabase/supabase-js'

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn()
  }))
}))

// Mock SupabaseAdapter
jest.mock('@/infrastructure/adapters/SupabaseAdapter')

describe('JobRepository', () => {
  let repository: JobRepository
  let mockSupabaseClient: any
  let mockAdapter: jest.Mocked<SupabaseAdapter>

  const mockJob: Job = {
    id: '123',
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Great opportunity',
    location: 'San Francisco, CA',
    jobType: JobType.FULL_TIME,
    userId: 'user-123',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  }

  const mockDbRecord = {
    id: '123',
    title: 'Software Engineer',
    company: 'Tech Corp',
    description: 'Great opportunity',
    location: 'San Francisco, CA',
    job_type: 'Full-Time',
    user_id: 'user-123',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()

    // Setup mock Supabase client
    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      single: jest.fn()
    }

    // Setup mock adapter
    mockAdapter = {
      getClient: jest.fn().mockReturnValue(mockSupabaseClient),
      getInstance: jest.fn(),
      beginTransaction: jest.fn(),
      query: jest.fn(),
      queryOne: jest.fn(),
      mutate: jest.fn(),
      queryPaginated: jest.fn(),
      exists: jest.fn(),
      count: jest.fn()
    } as any

    ;(SupabaseAdapter.getInstance as jest.Mock).mockReturnValue(mockAdapter)

    repository = new JobRepository(mockAdapter)
  })

  describe('create', () => {
    it('should create a new job', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockDbRecord,
        error: null
      })

      const jobData = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Great opportunity',
        location: 'San Francisco, CA',
        jobType: JobType.FULL_TIME,
        userId: 'user-123'
      }

      const result = await repository.create(jobData)

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
      expect(mockSupabaseClient.insert).toHaveBeenCalledWith({
        title: jobData.title,
        company: jobData.company,
        description: jobData.description,
        location: jobData.location,
        job_type: jobData.jobType,
        user_id: jobData.userId
      })
      expect(result.id).toBe('123')
      expect(result.title).toBe('Software Engineer')
    })

    it('should throw error if creation fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      })

      const jobData = {
        title: 'Software Engineer',
        company: 'Tech Corp',
        description: 'Great opportunity',
        location: 'San Francisco, CA',
        jobType: JobType.FULL_TIME,
        userId: 'user-123'
      }

      await expect(repository.create(jobData)).rejects.toThrow('Failed to create job: Database error')
    })
  })

  describe('findById', () => {
    it('should find a job by ID', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockDbRecord,
        error: null
      })

      const result = await repository.findById('123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '123')
      expect(result).not.toBeNull()
      expect(result?.id).toBe('123')
      expect(result?.title).toBe('Software Engineer')
    })

    it('should return null if job not found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'No rows found' }
      })

      const result = await repository.findById('nonexistent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Database connection error' }
      })

      await expect(repository.findById('123')).rejects.toThrow('Failed to find job: Database connection error')
    })
  })

  describe('findAll', () => {
    it('should find all jobs with pagination', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockDbRecord],
        error: null,
        count: 1
      })

      const result = await repository.findAll(undefined, { page: 1, limit: 20 })

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact' })
      expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 19)
      expect(result.data.length).toBe(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it('should apply location filter', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockDbRecord],
        error: null,
        count: 1
      })

      await repository.findAll({ location: 'San Francisco' })

      expect(mockSupabaseClient.ilike).toHaveBeenCalledWith('location', '%San Francisco%')
    })

    it('should apply job type filter', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockDbRecord],
        error: null,
        count: 1
      })

      await repository.findAll({ jobType: JobType.FULL_TIME })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('job_type', JobType.FULL_TIME)
    })

    it('should apply search term filter', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockDbRecord],
        error: null,
        count: 1
      })

      await repository.findAll({ searchTerm: 'engineer' })

      expect(mockSupabaseClient.or).toHaveBeenCalledWith(
        expect.stringContaining('title.ilike.%engineer%')
      )
    })

    it('should apply ordering', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockDbRecord],
        error: null,
        count: 1
      })

      await repository.findAll(undefined, {
        page: 1,
        limit: 20,
        orderBy: 'title',
        orderDirection: 'asc'
      })

      expect(mockSupabaseClient.order).toHaveBeenCalledWith('title', { ascending: true })
    })
  })

  describe('findByUserId', () => {
    it('should find jobs by user ID', async () => {
      mockSupabaseClient.range.mockResolvedValue({
        data: [mockDbRecord],
        error: null,
        count: 1
      })

      const result = await repository.findByUserId('user-123')

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('user_id', 'user-123')
      expect(result.data.length).toBe(1)
    })
  })

  describe('update', () => {
    it('should update a job', async () => {
      const updatedRecord = {
        ...mockDbRecord,
        title: 'Senior Software Engineer'
      }

      mockSupabaseClient.single.mockResolvedValue({
        data: updatedRecord,
        error: null
      })

      const result = await repository.update('123', { title: 'Senior Software Engineer' })

      expect(mockSupabaseClient.update).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Senior Software Engineer',
          updated_at: expect.any(String)
        })
      )
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '123')
      expect(result.title).toBe('Senior Software Engineer')
    })

    it('should throw error if update fails', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' }
      })

      await expect(
        repository.update('123', { title: 'New Title' })
      ).rejects.toThrow('Failed to update job: Update failed')
    })
  })

  describe('delete', () => {
    it('should delete a job', async () => {
      // Mock successful deletion
      mockSupabaseClient.delete.mockReturnThis()
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: null
      })

      // Mock exists check (should return false after deletion)
      const existsSpy = jest.spyOn(repository, 'exists').mockResolvedValue(false)

      const result = await repository.delete('123')

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('jobs')
      expect(mockSupabaseClient.delete).toHaveBeenCalled()
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '123')
      expect(result).toBe(true)

      existsSpy.mockRestore()
    })

    it('should throw error if deletion fails', async () => {
      mockSupabaseClient.delete.mockReturnThis()
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: { message: 'Deletion failed' }
      })

      await expect(repository.delete('123')).rejects.toThrow('Failed to delete job: Deletion failed')
    })
  })

  describe('exists', () => {
    it('should return true if job exists', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        count: 1,
        error: null
      })

      const result = await repository.exists('123')

      expect(mockSupabaseClient.select).toHaveBeenCalledWith('id', { count: 'exact', head: true })
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', '123')
      expect(result).toBe(true)
    })

    it('should return false if job does not exist', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        count: 0,
        error: null
      })

      const result = await repository.exists('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('count', () => {
    it('should count all jobs', async () => {
      mockSupabaseClient.select.mockResolvedValue({
        count: 42,
        error: null
      })

      const result = await repository.count()

      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*', { count: 'exact', head: true })
      expect(result).toBe(42)
    })

    it('should count jobs with filters', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        count: 5,
        error: null
      })

      const result = await repository.count({ jobType: JobType.FULL_TIME })

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('job_type', JobType.FULL_TIME)
      expect(result).toBe(5)
    })
  })

  describe('verifyOwnership', () => {
    it('should return true if user owns the job', async () => {
      const findByIdSpy = jest.spyOn(repository, 'findById').mockResolvedValue(mockJob)

      const result = await repository.verifyOwnership('123', 'user-123')

      expect(findByIdSpy).toHaveBeenCalledWith('123')
      expect(result).toBe(true)

      findByIdSpy.mockRestore()
    })

    it('should return false if user does not own the job', async () => {
      const findByIdSpy = jest.spyOn(repository, 'findById').mockResolvedValue(mockJob)

      const result = await repository.verifyOwnership('123', 'different-user')

      expect(result).toBe(false)

      findByIdSpy.mockRestore()
    })

    it('should return false if job does not exist', async () => {
      const findByIdSpy = jest.spyOn(repository, 'findById').mockResolvedValue(null)

      const result = await repository.verifyOwnership('nonexistent', 'user-123')

      expect(result).toBe(false)

      findByIdSpy.mockRestore()
    })
  })

  describe('helper methods', () => {
    it('should get recent jobs', async () => {
      const findAllSpy = jest.spyOn(repository, 'findAll').mockResolvedValue({
        data: [mockJob],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
        hasMore: false
      })

      const result = await repository.getRecentJobs(10)

      expect(findAllSpy).toHaveBeenCalledWith(
        undefined,
        {
          page: 1,
          limit: 10,
          orderBy: 'createdAt',
          orderDirection: 'desc'
        }
      )
      expect(result.length).toBe(1)

      findAllSpy.mockRestore()
    })

    it('should search jobs by keyword', async () => {
      const findAllSpy = jest.spyOn(repository, 'findAll').mockResolvedValue({
        data: [mockJob],
        total: 1,
        page: 1,
        limit: 50,
        totalPages: 1,
        hasMore: false
      })

      const result = await repository.searchJobs('engineer')

      expect(findAllSpy).toHaveBeenCalledWith(
        { searchTerm: 'engineer' },
        { page: 1, limit: 50 }
      )
      expect(result.length).toBe(1)

      findAllSpy.mockRestore()
    })
  })
})