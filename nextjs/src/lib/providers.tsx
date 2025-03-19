"use client"

/**
 * Providers component
 * 
 * Provides global context providers for the application.
 * 
 * Changes:
 * - Added GlobalProvider for theme and user context
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ToastProvider } from "@/components/ui/use-toast"
import { GlobalProvider } from "@/lib/context/GlobalContext"

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 5 * 60 * 1000, // 5 minutes
                        refetchOnWindowFocus: false,
                        retry: 1,
                    },
                    mutations: {
                        retry: 1,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <GlobalProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </GlobalProvider>
        </QueryClientProvider>
    )
}
