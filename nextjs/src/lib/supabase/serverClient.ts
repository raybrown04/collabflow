import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'

export async function createServerSupabaseClient() {
  // Get cookie store once so we can reuse it
  const cookieStore = await cookies()
  
  // Use the recommended createServerClient function from @supabase/ssr
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => {
          const cookie = cookieStore.get(name)
          return cookie?.value
        },
        set: () => {}, // Not needed for server component
        remove: () => {} // Not needed for server component
      },
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: false
      }
    }
  )
  
  return supabase
}
