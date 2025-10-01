import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth-helpers'
import { GetJobsUseCase } from '@/application/useCases/GetJobsUseCase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1') || 1
    const limit = parseInt(searchParams.get('limit') || '20') || 20
    const orderBy = searchParams.get('orderBy') as 'createdAt' | 'updatedAt' | 'title' | 'company' || 'createdAt'
    const orderDirection = searchParams.get('orderDirection') as 'asc' | 'desc' || 'desc'

    // Execute use case to get user's jobs
    const getJobsUseCase = new GetJobsUseCase()
    const result = await getJobsUseCase.getUserJobs(user.id, page, limit)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data
    })
  } catch (error) {
    console.error('Error in GET /api/users/jobs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}