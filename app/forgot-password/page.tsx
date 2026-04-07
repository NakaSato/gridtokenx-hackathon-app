'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { defaultApiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

type RequestState = 'idle' | 'loading' | 'success' | 'error'

export default function ForgotPasswordPage() {
    return (
        <ErrorBoundary name="Forgot Password">
            <ForgotPasswordContent />
        </ErrorBoundary>
    )
}

function ForgotPasswordContent() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [state, setState] = useState<RequestState>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            toast.error('Please enter your email address')
            return
        }

        setState('loading')
        setMessage('')

        try {
            const response = await fetch('/api/v1/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            })

            const data = await response.json()

            if (data.success) {
                setState('success')
                setMessage(data.message || 'If an account with that email exists, a password reset link has been sent.')
                toast.success('Check your email for the reset link!')
            } else {
                setState('error')
                setMessage(data.message || 'Failed to send reset email')
                toast.error(data.message || 'Failed to send reset email')
            }
        } catch (error) {
            console.error('Forgot password error:', error)
            setState('error')
            setMessage('An error occurred. Please try again.')
            toast.error('An error occurred. Please try again.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                    <CardDescription>
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {state === 'success' ? (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
                                <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-3" />
                                <p className="text-sm text-green-700 dark:text-green-400">
                                    {message}
                                </p>
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Didn&apos;t receive the email? Check your spam folder or{' '}
                                <button
                                    onClick={() => setState('idle')}
                                    className="text-primary hover:underline font-medium"
                                >
                                    try again
                                </button>
                            </p>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => router.push('/')}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {state === 'error' && message && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={state === 'loading'}
                                    required
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={state === 'loading'}
                            >
                                {state === 'loading' ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Reset Link...
                                    </>
                                ) : (
                                    <>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Send Reset Link
                                    </>
                                )}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground">
                                Remember your password?{' '}
                                <Link href="/" className="text-primary hover:underline font-medium">
                                    Sign in
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
