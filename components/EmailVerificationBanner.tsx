'use client'

import { useState } from 'react'
import { AlertTriangle, X, Mail, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthProvider'
import { Button } from '@/components/ui/button'
import { defaultApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

export function EmailVerificationBanner() {
    const { user, isAuthenticated } = useAuth()
    const [isDismissed, setIsDismissed] = useState(false)
    const [isResending, setIsResending] = useState(false)

    // Don't show if not authenticated, not applicable, or dismissed
    if (!isAuthenticated || !user || user.email_verified !== false || isDismissed) {
        return null
    }

    const handleResendVerification = async () => {
        if (isResending) return

        setIsResending(true)
        try {
            const response = await defaultApiClient.resendVerification(user.email)
            if (response.data?.success) {
                toast.success('Verification email sent! Check your inbox.')
            } else {
                toast.error(response.data?.message || 'Failed to send verification email')
            }
        } catch (error) {
            console.error('Resend verification error:', error)
            toast.error('Failed to send verification email. Please try again.')
        } finally {
            setIsResending(false)
        }
    }

    return (
        <div className="relative bg-amber-500/10 border-b border-amber-500/20">
            <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                        <p className="text-sm text-amber-700 dark:text-amber-300">
                            <span className="font-medium">Please verify your email address.</span>
                            <span className="hidden sm:inline"> Check your inbox for the verification link.</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="text-amber-700 border-amber-500/30 hover:bg-amber-500/10 dark:text-amber-300"
                        >
                            {isResending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Mail className="h-4 w-4 mr-1" />
                                    Resend Email
                                </>
                            )}
                        </Button>
                        <button
                            onClick={() => setIsDismissed(true)}
                            className="p-1 text-amber-500 hover:text-amber-600 dark:hover:text-amber-400"
                            aria-label="Dismiss"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
