import { GET } from '../../../../app/api/users/jobs/route'
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

import { getUser } from '@/lib/supabase/auth-helpers'
import { GetJobsUseCase } from '@/application/useCases/GetJobsUseCase'

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>
const MockGetJobsUseCase = GetJobsUseCase as jest.MockedClass<typeof GetJobsUseCase>

describe('/api/users/jobs', () => {
  const mockUserJobs = [
    {
      id: '1',
      title: 'My First Job',
      company: 'My Company',
      description: 'Job posted by me',
      location: 'New York, NY',
      jobType: JobType.FULL_TIME,
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'My Second Job',
      company: 'My Company',
      description: 'Another job posted by me',
      location: 'San Francisco, CA',
      jobType: JobType.REMOTE,
      userId: 'user123',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/users/jobs', () => {
    it('should return user jobs with default parameters', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockGetUserJobs = jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: mockUserJobs,
          total: 2,
          page: 1,
          limit: 20,
          hasMore: false
        }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        getUserJobs: mockGetUserJobs
      } as any))

      const request = new NextRequest('http://localhost:3000/api/users/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.data).toHaveLength(2)
      expect(data.data.data[0].id).toBe(mockUserJobs[0].id)
      expect(data.data.data[0].title).toBe(mockUserJobs[0].title)
      expect(mockGetUserJobs).toHaveBeenCalledWith('user123', 1, 20)
    })

    it('should handle pagination parameters', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockGetUserJobs = jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: [mockUserJobs[0]], // First job only
          total: 2,
          page: 2,
          limit: 1,
          hasMore: false
        }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        getUserJobs: mockGetUserJobs
      } as any))

      const request = new NextRequest('http://localhost:3000/api/users/jobs?page=2&limit=1')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.data).toHaveLength(1)
      expect(mockGetUserJobs).toHaveBeenCalledWith('user123', 2, 1)
    })

    it('should handle ordering parameters', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockGetUserJobs = jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: mockUserJobs,
          total: 2,
          page: 1,
          limit: 20,
          hasMore: false
        }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        getUserJobs: mockGetUserJobs
      } as any))

      const request = new NextRequest('http://localhost:3000/api/users/jobs?orderBy=title&orderDirection=asc')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(mockGetUserJobs).toHaveBeenCalledWith('user123', 1, 20)
    })

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/users/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should handle empty job list', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockGetUserJobs = jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: [],
          total: 0,
          page: 1,
          limit: 20,
          hasMore: false
        }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        getUserJobs: mockGetUserJobs
      } as any))

      const request = new NextRequest('http://localhost:3000/api/users/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.data).toHaveLength(0)
      expect(data.data.total).toBe(0)
    })

    it('should handle use case errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockGetUserJobs = jest.fn().mockResolvedValue({
        success: false,
        error: 'User ID is required'
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        getUserJobs: mockGetUserJobs
      } as any))

      const request = new NextRequest('http://localhost:3000/api/users/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User ID is required')
    })

    it('should handle internal server errors', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      MockGetJobsUseCase.mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const request = new NextRequest('http://localhost:3000/api/users/jobs')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle invalid page parameters gracefully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockGetUserJobs = jest.fn().mockResolvedValue({
        success: true,
        data: {
          data: mockUserJobs,
          total: 2,
          page: 1, // Corrected to valid page
          limit: 20, // Corrected to valid limit
          hasMore: false
        }
      })

      MockGetJobsUseCase.mockImplementation(() => ({
        getUserJobs: mockGetUserJobs
      } as any))

      const request = new NextRequest('http://localhost:3000/api/users/jobs?page=invalid&limit=abc')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should fall back to defaults: page=1, limit=20
      expect(mockGetUserJobs).toHaveBeenCalledWith('user123', 1, 20)
    })
  })
})