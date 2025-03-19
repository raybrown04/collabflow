import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    // Create a response object that we'll modify
    const response = NextResponse.next()

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name) {
                    return request.cookies.get(name)?.value
                },
                set(name, value, options) {
                    // If the cookie is updated, update the response headers
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                        // Security hardening per .clinerules
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'lax'
                    })
                },
                remove(name, options) {
                    // If the cookie is removed, update the response headers
                    response.cookies.delete(name)
                },
            },
            auth: {
                flowType: 'pkce',
                detectSessionInUrl: false,
                autoRefreshToken: true
            }
        }
    )

    // Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    
    try {
        // IMPORTANT: DO NOT REMOVE auth.getSession()
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session && request.nextUrl.pathname.startsWith('/app')) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
    } catch (error) {
        console.error('Auth validation failed:', error)
        // In case of error, redirect to login as a fallback
        if (request.nextUrl.pathname.startsWith('/app')) {
            const url = request.nextUrl.clone()
            url.pathname = '/auth/login'
            return NextResponse.redirect(url)
        }
    }

    // IMPORTANT: You *must* return the response object as it is with the cookies set above
    // to maintain the user's session.

    return response
}
