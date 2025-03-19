import { createServerClient } from '@supabase/ssr'
import { Database } from "@/lib/types";

export async function createServerAdminClient() {
    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.PRIVATE_SUPABASE_SERVICE_KEY!,
        {
            cookies: {
                // Implement required methods but with no-op functionality
                get: (name) => undefined,
                set: () => {},
                remove: () => {}
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
                flowType: 'pkce'
            },
            db: {
                schema: 'public'
            },
        }
    )
}
