"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ToastProvider } from "@/components/ui/use-toast"

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
            <ToastProvider>
                {children}
            </ToastProvider>
        </QueryClientProvider>
    )
}
