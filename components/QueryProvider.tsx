'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export default function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 min
                gcTime: 10 * 60 * 1000, // 10 minutes - keep unused cache for 10 min
                retry: 2, // Retry failed requests twice
                refetchOnWindowFocus: false, // Don't refetch on window focus (prevents unnecessary requests)
                refetchOnReconnect: true, // Refetch when reconnecting to network
                refetchOnMount: false, // Don't refetch on component mount (use stale data instead)
            },
            mutations: {
                retry: 1, // Retry mutations once
                gcTime: 5 * 60 * 1000, // Keep mutation cache for 5 minutes
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
