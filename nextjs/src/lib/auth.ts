"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/lib/database.types"
import { useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"

// Create a Supabase client for client components
export const supabase = createClientComponentClient<Database>()

// Hook to get the current authenticated user
export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    useEffect(() => {
        let subscription: { unsubscribe: () => void } | null = null;

        async function getUser() {
            try {
                // Get the current session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()

                if (sessionError) {
                    throw sessionError
                }

                if (session?.user) {
                    setUser(session.user)
                } else {
                    setUser(null)
                }

                // Set up a listener for auth state changes
                const { data } = await supabase.auth.onAuthStateChange(
                    (_event, session) => {
                        setUser(session?.user ?? null)
                    }
                )

                subscription = data.subscription;
            } catch (err) {
                console.error("Error getting auth user:", err)
                setError(err instanceof Error ? err : new Error("Unknown error"))
            } finally {
                setLoading(false)
            }
        }

        getUser()

        // Cleanup function
        return () => {
            if (subscription) {
                subscription.unsubscribe()
            }
        }
    }, [])

    return { user, loading, error }
}

// Test user ID for development
export const TEST_USER_ID = "b9b36d04-59e0-49d7-83ff-46c5186a8cf4";

// Function to get the current user ID or a fallback ID for development
export async function getCurrentUserId(): Promise<string> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error("Error getting current user:", error)
            // Don't throw the error, just use the fallback ID
            return TEST_USER_ID
        }

        if (!user) {
            console.warn("No authenticated user found, using fallback ID")
            // Use a fallback ID for development
            return TEST_USER_ID
        }

        return user.id
    } catch (err) {
        console.error("Error in getCurrentUserId:", err)
        // Use a fallback ID for development
        return TEST_USER_ID
    }
}
