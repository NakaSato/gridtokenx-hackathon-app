'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/contexts/AuthProvider'
import { useRouter } from 'next/navigation'
import React, { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireWallet?: boolean
  requireAuth?: boolean
  allowedRoles?: string[]
  redirectTo?: string // Custom redirect URL
}

export default function ProtectedRoute({
  children,
  fallback,
  requireWallet = true,
  requireAuth = true,
  allowedRoles,
  redirectTo = '/', // Default redirect to index page
}: ProtectedRouteProps) {
  const { connected } = useWallet()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Check authentication requirements
  const needsAuth = requireAuth && !isAuthenticated
  const needsWallet = requireWallet && !connected && !isAuthenticated
  const isUnauthorized = allowedRoles && user && !allowedRoles.includes(user.role)

  // Redirect to index if not authenticated or not authorized (after loading completes)
  useEffect(() => {
    if (!authLoading && (needsAuth || needsWallet || isUnauthorized)) {
      router.push(redirectTo)
    }
  }, [authLoading, needsAuth, needsWallet, isUnauthorized, router, redirectTo])

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not authenticated or not authorized, show loading while redirecting
  if (needsAuth || needsWallet || isUnauthorized) {
    if (fallback) {
      return <>{fallback}</>
    }

    const message = isUnauthorized
      ? 'Unauthorized - Redirecting...'
      : 'Redirecting to login...'

    // Show redirecting message while navigating to index
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 animate-spin">
          <div className="h-8 w-8 rounded-full border-b-2 border-primary"></div>
        </div>
        <p className="text-muted-foreground">{message}</p>
      </div>
    )
  }

  return <>{children}</>
}
