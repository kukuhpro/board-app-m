import { GET, PUT, DELETE } from '../../../../app/api/jobs/[id]/route'
import { NextRequest } from 'next/server'
import { JobType } from '@/domain/valueObjects/JobType'

// Mock the auth helpers
jest.mock('@/lib/supabase/auth-helpers', () => ({
  getUser: jest.fn()
}))

// Mock the use cases
jest.mock('@/application/useCases/GetJobByIdUseCase', () => ({
  GetJobByIdUseCase: jest.fn()
}))

jest.mock('@/application/useCases/UpdateJobUseCase', () => ({
  UpdateJobUseCase: jest.fn()
}))

jest.mock('@/application/useCases/DeleteJobUseCase', () => ({
  DeleteJobUseCase: jest.fn()
}))

import { getUser } from '@/lib/supabase/auth-helpers'
import { GetJobByIdUseCase } from '@/application/useCases/GetJobByIdUseCase'
import { UpdateJobUseCase } from '@/application/useCases/UpdateJobUseCase'
import { DeleteJobUseCase } from '@/application/useCases/DeleteJobUseCase'

const mockGetUser = getUser as jest.MockedFunction<typeof getUser>
const MockGetJobByIdUseCase = GetJobByIdUseCase as jest.MockedClass<typeof GetJobByIdUseCase>
const MockUpdateJobUseCase = UpdateJobUseCase as jest.MockedClass<typeof UpdateJobUseCase>
const MockDeleteJobUseCase = DeleteJobUseCase as jest.MockedClass<typeof DeleteJobUseCase>

describe('/api/jobs/[id]', () => {
  const mockJob = {
    id: 'job123',
    title: 'Senior Developer',
    company: 'Tech Corp',
    description: 'Job description',
    location: 'New York, NY',
    jobType: JobType.FULL_TIME,
    userId: 'user123',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  const mockParams = Promise.resolve({ id: 'job123' })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/jobs/[id]', () => {
    it('should return job details for authenticated user', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        job: mockJob,
        isOwner: true,
        canEdit: true
      })

      MockGetJobByIdUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123')
      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.job.id).toBe(mockJob.id)
      expect(data.data.job.title).toBe(mockJob.title)
      expect(data.data.job.company).toBe(mockJob.company)
      expect(data.data.isOwner).toBe(true)
      expect(data.data.canEdit).toBe(true)
      expect(mockExecute).toHaveBeenCalledWith('job123', 'user123')
    })

    it('should return job details for anonymous user', async () => {
      mockGetUser.mockResolvedValue(null)

      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        job: mockJob,
        isOwner: false,
        canEdit: false
      })

      MockGetJobByIdUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123')
      const response = await GET(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.isOwner).toBe(false)
      expect(data.data.canEdit).toBe(false)
      expect(mockExecute).toHaveBeenCalledWith('job123', undefined)
    })

    it('should return 404 for non-existent job', async () => {
      mockGetUser.mockResolvedValue(null)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Job not found'
      })

      MockGetJobByIdUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/nonexistent')
      const nonExistentParams = Promise.resolve({ id: 'nonexistent' })
      const response = await GET(request, { params: nonExistentParams })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Job not found')
    })

    it('should handle invalid job ID format', async () => {
      mockGetUser.mockResolvedValue(null)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Invalid job ID format'
      })

      MockGetJobByIdUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/invalid-id')
      const invalidParams = Promise.resolve({ id: 'invalid-id' })
      const response = await GET(request, { params: invalidParams })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid job ID format')
    })
  })

  describe('PUT /api/jobs/[id]', () => {
    const updateData = {
      title: 'Updated Senior Developer',
      description: 'Updated description'
    }

    it('should update job successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const updatedJob = { ...mockJob, ...updateData }
      const mockExecute = jest.fn().mockResolvedValue({
        success: true,
        job: updatedJob
      })

      MockUpdateJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe(updatedJob.id)
      expect(data.data.title).toBe(updatedJob.title)
      expect(data.data.description).toBe(updatedJob.description)
      expect(mockExecute).toHaveBeenCalledWith('job123', updateData, 'user123')
    })

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should validate input data', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const invalidUpdateData = {
        title: 'a', // Too short
        company: '' // Empty
      }

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'PUT',
        body: JSON.stringify(invalidUpdateData)
      })

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(422)
      expect(data.error).toBe('Validation failed')
      expect(data.validationErrors).toBeDefined()
    })

    it('should return 404 for non-existent job', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Job not found'
      })

      MockUpdateJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/nonexistent', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const nonExistentParams = Promise.resolve({ id: 'nonexistent' })
      const response = await PUT(request, { params: nonExistentParams })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Job not found')
    })

    it('should return 403 for permission denied', async () => {
      const mockUser = { id: 'differentUser', email: 'other@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'You do not have permission to update this job'
      })

      MockUpdateJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })

      const response = await PUT(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('You do not have permission to update this job')
    })
  })

  describe('DELETE /api/jobs/[id]', () => {
    it('should delete job successfully', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: true
      })

      MockDeleteJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.message).toBe('Job deleted successfully')
      expect(mockExecute).toHaveBeenCalledWith('job123', 'user123', false)
    })

    it('should handle force delete', async () => {
      const mockUser = { id: 'admin123', email: 'admin@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: true
      })

      MockDeleteJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123?force=true', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockExecute).toHaveBeenCalledWith('job123', 'admin123', true)
    })

    it('should require authentication', async () => {
      mockGetUser.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 404 for non-existent job', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'Job not found'
      })

      MockDeleteJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/nonexistent', {
        method: 'DELETE'
      })

      const nonExistentParams = Promise.resolve({ id: 'nonexistent' })
      const response = await DELETE(request, { params: nonExistentParams })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Job not found')
    })

    it('should return 403 for permission denied', async () => {
      const mockUser = { id: 'differentUser', email: 'other@example.com' }
      mockGetUser.mockResolvedValue(mockUser as any)

      const mockExecute = jest.fn().mockResolvedValue({
        success: false,
        error: 'You do not have permission to delete this job'
      })

      MockDeleteJobUseCase.mockImplementation(() => ({
        execute: mockExecute
      } as any))

      const request = new NextRequest('http://localhost:3000/api/jobs/job123', {
        method: 'DELETE'
      })

      const response = await DELETE(request, { params: mockParams })
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('You do not have permission to delete this job')
    })
  })
})