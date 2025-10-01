import { GET, POST } from '../../../app/api/jobs/route'
import { NextRequest } from 'next/server'
import { JobType } from '@/domain/valueObjects/JobType'

// Mock the auth helpers
jest.mock('@/lib/supabase/auth-helpers', () => ({
  getUser: jest.fn()
}))

// Mock the use cases
jest.mock('@/application/useCases/GetJobsUseCase', () => ({
  GetJobsUseCase: jest.fn()
}))

jest.mock('@/application/useCases/CreateJobUseCase', () => ({
  CreateJobUseCase: jest.fn()
}))

import { getUser } from '@/lib/supabase/auth-helpers'
import { GetJobsUseCase } from '@/application/useCases/GetJobsUseCase'
import { CreateJobUseCase } from '@/application/useCases/CreateJobUseCase'

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>
const MockGetJobsUseCase = GetJobsUseCase as jest.MockedClass<typeof GetJobsUseCase>
const MockCreateJobUseCase = CreateJobUseCase as jest.MockedClass<typeof CreateJobUseCase>

describe('/api/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/jobs', () => {
    it('should return paginated job list with default parameters', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: [
            {
              id: '1',
              title: 'Test Job',
              company: 'Test Company',
              description: 'Test description',
              location: 'Test Location',
              jobType: JobType.FULL_TIME,
              userId: 'user1',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ],
          total: 1,
          page: 1,
          limit: 20,
          hasMore: false
        }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toBeDefined()
      expect(mockExecute).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        location: undefined,
        jobType: undefined,
        searchTerm: undefined,
        orderBy: 'createdAt',
        orderDirection: 'desc'
      })
    })

    it('should handle query parameters correctly', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        data: { data: [], total: 0, page: 2, limit: 10, hasMore: false }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs?page=2&limit=10&location=New%20York&jobType=REMOTE&search=developer&orderBy=title&orderDirection=asc')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockExecute).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        location: 'New York',
        jobType: 'REMOTE',
        searchTerm: 'developer',
        orderBy: 'title',
        orderDirection: 'asc'
      })
    })

    it('should handle use case errors', async () => {
      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid parameters'
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid parameters')
    })

    it('should handle internal server errors', async () => {
      MockGetJobsUseCase.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/jobs', () => {
    const validJobData = {
      title: 'Senior Developer',
      company: 'Tech Corp',
      description: 'We are looking for a senior developer with 5+ years of experience.',
      location: 'New York, NY',
      jobType: JobType.FULL_TIME
    }

    it('should create a job successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      const createdJob = {
        id: 'job123',
        ...validJobData,
        userId: 'user123',
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        job: createdJob
      })

      MockCreateJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(createdJob.id)
      expect(data.data.title).toBe(createdJob.title)
      expect(data.data.company).toBe(createdJob.company)
      expect(mockExecute).toHaveBeenCalledWith(validJobData, 'user123')
    })

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate input data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const invalidJobData = {
        title: 'a', // Too short
        company: '', // Empty
        description: 'short', // Too short
        location: '',
        jobType: 'INVALID'
      }

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(invalidJobData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toBe('Validation failed')
      expect(data.validationErrors).toBeDefined()
    })

    it('should handle use case validation errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'This company is not allowed to post jobs on our platform',
        validationErrors: {}
      })

      MockCreateJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toBe('This company is not allowed to post jobs on our platform')
    })

    it('should handle use case business logic errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'A similar job posting from your company already exists. Please update the existing posting instead.'
      })

      MockCreateJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs', {
        method: 'POST',
        body: JSON.stringify(validJobData)
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('A similar job posting from your company already exists. Please update the existing posting instead.')
    })
  })
})