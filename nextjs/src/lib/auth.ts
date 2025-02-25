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
    const [isAdmin, setIsAdmin] = useState(false)

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

                    // Check if user is admin using RPC function
                    const { data, error } = await supabase.rpc('get_auth_user_role', {
                        user_id: session.user.id
                    })

                    if (!error && data) {
                        setIsAdmin(data === 'admin')
                    }
                } else {
                    setUser(null)
                    setIsAdmin(false)
                }

                // Set up a listener for auth state changes
                const { data } = await supabase.auth.onAuthStateChange(
                    async (_event, session) => {
                        setUser(session?.user ?? null)

                        if (session?.user) {
                            // Check if user is admin using RPC function
                            const { data, error } = await supabase.rpc('get_auth_user_role', {
                                user_id: session.user.id
                            })

                            if (!error && data) {
                                setIsAdmin(data === 'admin')
                            } else {
                                setIsAdmin(false)
                            }
                        } else {
                            setIsAdmin(false)
                        }
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

    return { user, loading, error, isAdmin }
}

// Test user ID for development - only use in development environment
export const TEST_USER_ID = process.env.NODE_ENV === 'development'
    ? "b9b36d04-59e0-49d7-83ff-46c5186a8cf4"
    : "";

// Function to get the current user ID
export async function getCurrentUserId(): Promise<string> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error) {
            console.error("Error getting current user:", error)

            // Only use fallback in development
            if (process.env.NODE_ENV === 'development' && TEST_USER_ID) {
                console.warn("Using fallback test user ID in development")
                return TEST_USER_ID
            }

            throw error
        }

        if (!user) {
            // Only use fallback in development
            if (process.env.NODE_ENV === 'development' && TEST_USER_ID) {
                console.warn("Using fallback test user ID in development")
                return TEST_USER_ID
            }

            throw new Error("No authenticated user found")
        }

        return user.id
    } catch (err) {
        console.error("Error in getCurrentUserId:", err)

        // Only use fallback in development
        if (process.env.NODE_ENV === 'development' && TEST_USER_ID) {
            console.warn("Using fallback test user ID in development")
            return TEST_USER_ID
        }

        throw err
    }
}

// Function to check if current user is admin
export async function isCurrentUserAdmin(): Promise<boolean> {
    try {
        const userId = await getCurrentUserId()

        const { data, error } = await supabase.rpc('get_auth_user_role', {
            user_id: userId
        })

        if (error) {
            console.error("Error checking admin status:", error)
            return false
        }

        return data === 'admin'
    } catch (err) {
        console.error("Error in isCurrentUserAdmin:", err)
        return false
    }
}
