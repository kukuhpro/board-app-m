import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
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

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.json(
        {
          error: 'Failed to get session',
          details: sessionError.message
        },
        { status: 500 }
      )
    }

    // If no session exists
    if (!session) {
      return NextResponse.json(
        {
          authenticated: false,
          user: null,
          session: null
        },
        { status: 200 }
      )
    }

    // Get the current user details
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('User fetch error:', userError)
      return NextResponse.json(
        {
          error: 'Failed to get user details',
          details: userError.message
        },
        { status: 500 }
      )
    }

    // Check if session needs refresh
    const expiresAt = session.expires_at ? new Date(session.expires_at * 1000) : null
    const needsRefresh = expiresAt ? expiresAt.getTime() - Date.now() < 60 * 60 * 1000 : false // Less than 1 hour

    // Attempt to refresh if needed
    if (needsRefresh) {
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (!refreshError && refreshData.session) {
        // Update response with new session
        const response = NextResponse.json(
          {
            authenticated: true,
            user: {
              id: user?.id,
              email: user?.email,
              email_confirmed_at: user?.email_confirmed_at,
              app_metadata: user?.app_metadata,
              user_metadata: user?.user_metadata,
              created_at: user?.created_at,
              updated_at: user?.updated_at
            },
            session: {
              access_token: refreshData.session.access_token,
              refresh_token: refreshData.session.refresh_token,
              expires_at: refreshData.session.expires_at,
              expires_in: refreshData.session.expires_in,
              refreshed: true
            }
          },
          { status: 200 }
        )

        // Update cookies with new tokens
        response.cookies.set({
          name: 'sb-access-token',
          value: refreshData.session.access_token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: refreshData.session.expires_in || 3600
        })

        response.cookies.set({
          name: 'sb-refresh-token',
          value: refreshData.session.refresh_token,
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7 // 7 days
        })

        return response
      }
    }

    // Return current session info
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: user?.id,
          email: user?.email,
          email_confirmed_at: user?.email_confirmed_at,
          app_metadata: user?.app_metadata,
          user_metadata: user?.user_metadata,
          created_at: user?.created_at,
          updated_at: user?.updated_at
        },
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Session check error:', error)

    return NextResponse.json(
      {
        error: 'An unexpected error occurred while checking session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}