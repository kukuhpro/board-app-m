import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth-helpers'
import { GetJobsUseCase } from '@/application/useCases/GetJobsUseCase'
import { CreateJobUseCase } from '@/application/useCases/CreateJobUseCase'
import { CreateJobSchema } from '@/lib/validations/job'
import { JobType } from '@/domain/valueObjects/JobType'
import { withTelemetry, apiMetrics } from '@/lib/telemetry/api-wrapper'
import { withSpan, addSpanAttributes } from '@/lib/telemetry/tracer'

export const GET = withTelemetry(async function GET(request: NextRequest) {
  const startTime = Date.now()
  apiMetrics.incrementActiveRequests()

  try {
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1') || 1
    const limit = parseInt(searchParams.get('limit') || '20') || 20
    const location = searchParams.get('location') || undefined
    const jobType = searchParams.get('jobType') as JobType || undefined
    const searchTerm = searchParams.get('search') || undefined
    const orderBy = searchParams.get('orderBy') as 'createdAt' | 'updatedAt' | 'title' | 'company' || 'createdAt'
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc'

    // Execute use case with telemetry
    const result = await withSpan(
      'GetJobsUseCase.execute',
      async (span) => {
        addSpanAttributes(span, {
          'jobs.query.page': page,
          'jobs.query.limit': limit,
          'jobs.query.location': location,
          'jobs.query.jobType': jobType,
          'jobs.query.searchTerm': searchTerm,
          'jobs.query.orderBy': orderBy,
          'jobs.query.orderDirection': orderDirection,
        })

        const getJobsUseCase = new GetJobsUseCase()
        const result = await getJobsUseCase.execute({
          page,
          limit,
          location,
          jobType,
          searchTerm,
          orderBy,
          orderDirection
        })

        if (result.success && result.data) {
          addSpanAttributes(span, {
            'jobs.result.count': result.data.jobs?.length || 0,
            'jobs.result.total': result.data.total,
            'jobs.result.hasMore': result.data.hasMore,
          })
        }

        return result
      }
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    const response = NextResponse.json({
      success: true,
      data: {
        jobs: result.data?.data || [],
        total: result.data?.total || 0,
        page: result.data?.page || 1,
        totalPages: result.data?.totalPages || 0
      }
    })

    const duration = Date.now() - startTime
    apiMetrics.recordRequest('GET', '/api/jobs', response.status, duration)

    return response
  } catch (error) {
    console.error('Error in GET /api/jobs:', error)
    const duration = Date.now() - startTime
    apiMetrics.recordRequest('GET', '/api/jobs', 500, duration)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    apiMetrics.decrementActiveRequests()
  }
}, { spanName: 'GET /api/jobs' })

export const POST = withTelemetry(async function POST(request: NextRequest) {
  const startTime = Date.now()
  apiMetrics.incrementActiveRequests()

  try {
    // Check authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()

    // Validate input
    const validationResult = CreateJobSchema.safeParse(body)
    if (!validationResult.success) {
      const errors: Record<string, string[]> = {}
      validationResult.error.issues.forEach((issue) => {
        const field = issue.path.join('.')
        if (!errors[field]) {
          errors[field] = []
        }
        errors[field].push(issue.message)
      })

      return NextResponse.json(
        {
          error: 'Validation failed',
          validationErrors: errors
        },
        { status: 422 }
      )
    }

    // Execute use case with telemetry
    const result = await withSpan(
      'CreateJobUseCase.execute',
      async (span) => {
        addSpanAttributes(span, {
          'jobs.create.userId': user.id,
          'jobs.create.jobType': validationResult.data.jobType,
          'jobs.create.location': validationResult.data.location,
        })

        const createJobUseCase = new CreateJobUseCase()
        const result = await createJobUseCase.execute(validationResult.data, user.id)

        if (result.success && result.job) {
          addSpanAttributes(span, {
            'jobs.create.jobId': result.job.id,
            'jobs.create.success': true,
          })
        } else {
          addSpanAttributes(span, {
            'jobs.create.success': false,
            'jobs.create.error': result.error,
          })
        }

        return result
      }
    )

    if (!result.success) {
      const statusCode = result.validationErrors ? 422 : 400
      return NextResponse.json(
        {
          error: result.error,
          validationErrors: result.validationErrors
        },
        { status: statusCode }
      )
    }

    const response = NextResponse.json({
      success: true,
      data: result.job
    }, { status: 201 })

    const duration = Date.now() - startTime
    apiMetrics.recordRequest('POST', '/api/jobs', response.status, duration)

    return response
  } catch (error) {
    console.error('Error in POST /api/jobs:', error)
    const duration = Date.now() - startTime
    apiMetrics.recordRequest('POST', '/api/jobs', 500, duration)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    apiMetrics.decrementActiveRequests()
  }
}, { spanName: 'POST /api/jobs' })