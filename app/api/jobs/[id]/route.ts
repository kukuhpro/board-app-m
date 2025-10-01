import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/auth-helpers'
import { GetJobByIdUseCase } from '@/application/useCases/GetJobByIdUseCase'
import { UpdateJobUseCase } from '@/application/useCases/UpdateJobUseCase'
import { DeleteJobUseCase } from '@/application/useCases/DeleteJobUseCase'
import { UpdateJobSchema } from '@/lib/validations/job'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Get current user (optional for viewing jobs)
    const user = await getUser()
    const userId = user?.id

    // Execute use case
    const getJobByIdUseCase = new GetJobByIdUseCase()
    const result = await getJobByIdUseCase.execute(id, userId)

    if (!result.success) {
      const statusCode = result.error === 'Job not found' ? 404 : 400
      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        job: result.job,
        isOwner: result.isOwner,
        canEdit: result.canEdit
      }
    })
  } catch (error) {
    console.error('Error in GET /api/jobs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

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
    const validationResult = UpdateJobSchema.safeParse(body)
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

    // Execute use case
    const updateJobUseCase = new UpdateJobUseCase()
    const result = await updateJobUseCase.execute(id, validationResult.data, user.id)

    if (!result.success) {
      let statusCode = 400

      if (result.error === 'Job not found') {
        statusCode = 404
      } else if (result.error === 'You do not have permission to update this job') {
        statusCode = 403
      } else if (result.validationErrors) {
        statusCode = 422
      }

      return NextResponse.json(
        {
          error: result.error,
          validationErrors: result.validationErrors
        },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.job
    })
  } catch (error) {
    console.error('Error in PUT /api/jobs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params

    // Check authentication
    const user = await getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check for force delete flag (admin only)
    const searchParams = request.nextUrl.searchParams
    const forceDelete = searchParams.get('force') === 'true'

    // Execute use case
    const deleteJobUseCase = new DeleteJobUseCase()
    const result = await deleteJobUseCase.execute(id, user.id, forceDelete)

    if (!result.success) {
      let statusCode = 400

      if (result.error === 'Job not found') {
        statusCode = 404
      } else if (result.error === 'You do not have permission to delete this job') {
        statusCode = 403
      }

      return NextResponse.json(
        { error: result.error },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Job deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/jobs/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}