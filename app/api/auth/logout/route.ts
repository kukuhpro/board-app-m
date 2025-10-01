import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          }
        }
      }
    )

    // Check if user is currently logged in
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json(
        { message: 'No active session to log out from' },
        { status: 200 }
      )
    }

    // Sign out the user
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to log out' },
        { status: 500 }
      )
    }

    // Clear auth cookies
    const response = NextResponse.json(
      {
        message: 'Logged out successfully',
        user: null,
        session: null
      },
      { status: 200 }
    )

    // Remove auth cookies
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')

    // Also delete the default Supabase cookies
    const cookieNames = [
      'sb-access-token',
      'sb-refresh-token',
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`,
      `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token-code-verifier`
    ]

    cookieNames.forEach(name => {
      response.cookies.set({
        name,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0
      })
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred during logout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for convenience (e.g., logout links)
export async function GET(request: NextRequest) {
  return POST(request)
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}