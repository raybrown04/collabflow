import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// This route handler executes the SQL command to reload the PostgREST schema cache
export async function GET() {
  try {
    // Create a Supabase client with admin privileges
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => cookieStore.get(name)?.value,
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.set(name, '', { ...options, maxAge: 0 });
          }
        }
      }
    );
    
    // Execute the SQL command to reload the schema cache
    const { error } = await supabase.rpc('reload_schema_cache');
    
    if (error) {
      console.error('Error reloading schema cache:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, message: 'Schema cache reloaded successfully' });
  } catch (err) {
    console.error('Unexpected error reloading schema cache:', err);
    return NextResponse.json({ success: false, error: 'Unexpected error' }, { status: 500 });
  }
}
