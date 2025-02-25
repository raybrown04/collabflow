# Guide: Updating Next.js Components for Development Mode

This guide provides specific instructions for updating Next.js components to work with the development mode pattern we've implemented for Supabase authentication.

## Next.js-Specific Considerations

When implementing development mode in a Next.js application, there are some specific considerations:

1. **Server Components vs. Client Components**: Development mode detection needs to be client-side only
2. **Server-Side Rendering**: Mock data should be consistent between server and client renders
3. **App Router**: Special handling for route handlers and server actions
4. **Environment Variables**: Proper use of `NEXT_PUBLIC_` prefix for client-side variables

## Updating Components

### 1. Add "use client" Directive

Ensure components that need development mode detection have the "use client" directive:

```typescript
"use client"

import { useState, useEffect } from "react"
// Other imports...

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export function YourComponent() {
    // Component logic...
}
```

### 2. Update Data Fetching Hooks

For components using React Query or SWR:

```typescript
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
// Other imports...

// Mock data
const mockData = [
    // Your mock data...
]

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Data fetching function
async function fetchData(): Promise<DataType[]> {
    // In development mode, return mock data
    if (isDevelopment) {
        console.log("Development mode: Using mock data")
        return mockData
    }

    // Real data fetching logic...
}

// React Query hook
export function useData() {
    return useQuery({
        queryKey: ['data'],
        queryFn: fetchData,
        staleTime: 5 * 60 * 1000, // 5 minutes
    })
}

// Component using the hook
export function DataComponent() {
    const { data, isLoading, error } = useData()
    
    // Render logic...
}
```

### 3. Update Form Components

For components that submit data:

```typescript
"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
// Other imports...

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Create function
async function createItem(item: NewItemType): Promise<ItemType> {
    // In development mode, create a mock item
    if (isDevelopment) {
        console.log("Development mode: Creating mock item", item)
        const mockItem: ItemType = {
            id: Math.random().toString(36).substring(2, 15),
            created_at: new Date().toISOString(),
            ...item
        }
        
        // Add to mock data (if you're maintaining it in memory)
        mockData.push(mockItem)
        
        return mockItem
    }
    
    // Real create logic...
}

// React Query mutation hook
export function useCreateItem() {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: createItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['data'] })
        },
    })
}

// Form component
export function ItemForm() {
    const [title, setTitle] = useState("")
    // Other form state...
    
    const createItemMutation = useCreateItem()
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        const newItem = {
            title,
            // Other fields...
        }
        
        createItemMutation.mutate(newItem, {
            onSuccess: (item) => {
                console.log("Item created:", item)
                // Reset form...
            },
            onError: (error) => {
                console.error("Error creating item:", error)
                // Handle error...
            }
        })
    }
    
    // Render form...
}
```

### 4. Update Authentication Components

For components that need authentication:

```typescript
"use client"

import { useState, useEffect } from "react"
// Other imports...

// Development mode detection
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// Mock user for development mode
const mockUser = {
    id: "dev-user-id",
    email: "dev@example.com",
    // Other user properties...
}

// Authentication hook
export function useAuth() {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    
    useEffect(() => {
        const checkAuth = async () => {
            // In development mode, use mock user
            if (isDevelopment) {
                console.log("Development mode: Using mock user")
                setUser(mockUser)
                setLoading(false)
                return
            }
            
            try {
                const { data: { session }, error } = await supabase.auth.getSession()
                
                if (error) throw error
                
                setUser(session?.user || null)
            } catch (err) {
                console.error("Auth error:", err)
                setError(err.message)
                
                // Fallback to mock user in development mode
                if (isDevelopment) {
                    console.warn("Falling back to mock user after error")
                    setUser(mockUser)
                    setError(null) // Clear the error since we're using fallback data
                }
            } finally {
                setLoading(false)
            }
        }
        
        checkAuth()
        
        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user || null)
            }
        )
        
        return () => {
            subscription.unsubscribe()
        }
    }, [])
    
    return { user, loading, error }
}

// Protected component
export function ProtectedComponent() {
    const { user, loading, error } = useAuth()
    
    if (loading) {
        return <div>Loading...</div>
    }
    
    if (error && !user) {
        return <div>Error: {error}</div>
    }
    
    if (!user) {
        return <div>Please log in to access this content.</div>
    }
    
    // Render protected content...
}
```

### 5. Update Route Handlers (App Router)

For API routes in the App Router:

```typescript
// app/api/data/route.ts
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

// Mock data for development mode
const mockData = [
    // Your mock data...
]

export async function GET(request: Request) {
    // Check if we're in development mode
    // Note: We can't use window.location in server components
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // In development mode, return mock data
    if (isDevelopment) {
        console.log("Development mode: Using mock data in API route")
        return NextResponse.json(mockData)
    }
    
    try {
        // Create Supabase client
        const supabase = createRouteHandlerClient({ cookies })
        
        // Get session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        
        // Fetch data
        const { data, error } = await supabase.from('your_table').select('*')
        
        if (error) {
            throw error
        }
        
        return NextResponse.json(data)
    } catch (error) {
        console.error("API route error:", error)
        
        // Fallback to mock data in development mode
        if (isDevelopment) {
            console.warn("Falling back to mock data after error in API route")
            return NextResponse.json(mockData)
        }
        
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
```

### 6. Update Server Actions (App Router)

For server actions in the App Router:

```typescript
"use server"

import { cookies } from 'next/headers'
import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { revalidatePath } from 'next/cache'

// Mock data for development mode
const mockData = [
    // Your mock data...
]

export async function createItem(formData: FormData) {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // Extract data from form
    const title = formData.get('title') as string
    // Other fields...
    
    // In development mode, return mock response
    if (isDevelopment) {
        console.log("Development mode: Creating mock item in server action")
        
        // Create mock item
        const mockItem = {
            id: Math.random().toString(36).substring(2, 15),
            title,
            // Other fields...
            created_at: new Date().toISOString()
        }
        
        // Add to mock data (note: this won't persist across requests)
        mockData.push(mockItem)
        
        // Revalidate path
        revalidatePath('/your-path')
        
        return { success: true, data: mockItem }
    }
    
    try {
        // Create Supabase client
        const supabase = createServerActionClient({ cookies })
        
        // Get session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
            return { error: "Unauthorized", success: false }
        }
        
        // Create item
        const { data, error } = await supabase
            .from('your_table')
            .insert([
                {
                    title,
                    // Other fields...
                    user_id: session.user.id
                }
            ])
            .select()
            .single()
        
        if (error) {
            throw error
        }
        
        // Revalidate path
        revalidatePath('/your-path')
        
        return { success: true, data }
    } catch (error) {
        console.error("Server action error:", error)
        
        // Fallback to mock response in development mode
        if (isDevelopment) {
            console.warn("Falling back to mock response after error in server action")
            
            // Create mock item
            const mockItem = {
                id: Math.random().toString(36).substring(2, 15),
                title,
                // Other fields...
                created_at: new Date().toISOString()
            }
            
            // Revalidate path
            revalidatePath('/your-path')
            
            return { success: true, data: mockItem }
        }
        
        return { error: error.message, success: false }
    }
}
```

## Handling Environment Variables

For Next.js applications, ensure environment variables are properly configured:

```typescript
// In your .env.local file
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

// In your code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## Handling Server-Side Rendering

For components that are server-side rendered, ensure your development mode detection works correctly:

```typescript
"use client"

import { useState, useEffect } from "react"
// Other imports...

export function YourComponent({ initialData }) {
    const [data, setData] = useState(initialData)
    const [loading, setLoading] = useState(!initialData)
    const [error, setError] = useState(null)
    
    // Development mode detection (client-side only)
    const [isDevelopment, setIsDevelopment] = useState(false)
    
    useEffect(() => {
        // Set development mode flag
        setIsDevelopment(window.location.hostname === 'localhost')
        
        // If we already have initial data, no need to fetch again
        if (initialData) return
        
        const fetchData = async () => {
            // Check development mode
            if (window.location.hostname === 'localhost') {
                console.log("Development mode: Using mock data")
                setData(mockData)
                setLoading(false)
                return
            }
            
            // Real data fetching logic...
        }
        
        fetchData()
    }, [initialData])
    
    // Render logic...
}

// Server component that provides initial data
export async function getServerSideProps() {
    // Check if we're in development mode
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    // In development mode, return mock data
    if (isDevelopment) {
        return {
            props: {
                initialData: mockData
            }
        }
    }
    
    try {
        // Real data fetching logic...
    } catch (error) {
        console.error("Server-side error:", error)
        
        // Fallback to mock data in development mode
        if (isDevelopment) {
            return {
                props: {
                    initialData: mockData
                }
            }
        }
        
        return {
            props: {
                initialData: null,
                error: error.message
            }
        }
    }
}
```

## Testing Your Implementation

1. Run your Next.js application in development mode: `npm run dev`
2. Check the console for "Development mode" log messages
3. Verify that components render correctly with mock data
4. Test form submissions and other interactions
5. Verify that server-side rendered pages work correctly

By following these patterns, you can make your Next.js application work seamlessly in development mode without requiring authentication or a connection to Supabase.
