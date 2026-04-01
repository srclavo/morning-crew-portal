import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isAuthRoute = path.startsWith('/login')
  const isPublicRoute = path === '/' || path.startsWith('/onboarding/pending')
  const isCallbackRoute = path.startsWith('/auth')
  const isOnboarding = path.startsWith('/onboarding')

  if (!user && !isAuthRoute && !isPublicRoute && !isCallbackRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isAuthRoute && !isCallbackRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Block onboarding for inactive users
  if (user && isOnboarding && !path.startsWith('/onboarding/pending')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('active')
      .eq('id', user.id)
      .single()

    if (!profile?.active) {
      return NextResponse.redirect(new URL('/onboarding/pending', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
