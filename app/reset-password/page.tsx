'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowLeft, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import toast from 'react-hot-toast'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

type ResetState = 'idle' | 'loading' | 'success' | 'error' | 'invalid'

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [state, setState] = useState<ResetState>('idle')
    const [message, setMessage] = useState('')

    useEffect(() => {
        if (!token) {
            setState('invalid')
            setMessage('Invalid or missing reset token. Please request a new password reset link.')
        }
    }, [token])

    const validatePassword = (pwd: string): string | null => {
        if (pwd.length < 8) {
            return 'Password must be at least 8 characters long'
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!token) {
            toast.error('Invalid reset token')
            return
        }

        const passwordError = validatePassword(password)
        if (passwordError) {
            toast.error(passwordError)
            return
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }

        setState('loading')
        setMessage('')

        try {
            const response = await fetch('/api/v1/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    new_password: password,
                }),
            })

            const data = await response.json()

            if (data.success) {
                setState('success')
                setMessage(data.message || 'Password has been reset successfully!')
                toast.success('Password reset successful!')

                // Redirect to home after 3 seconds
                setTimeout(() => {
                    router.push('/')
                }, 3000)
            } else {
                setState('error')
                setMessage(data.message || 'Failed to reset password')
                toast.error(data.message || 'Failed to reset password')
            }
        } catch (error) {
            console.error('Reset password error:', error)
            setState('error')
            setMessage('An error occurred. Please try again.')
            toast.error('An error occurred. Please try again.')
        }
    }

    if (state === 'invalid') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
                            <AlertCircle className="h-7 w-7 text-red-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Invalid Reset Link</CardTitle>
                        <CardDescription>{message}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => router.push('/forgot-password')}
                        >
                            Request New Reset Link
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={() => router.push('/')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (state === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                            <CheckCircle className="h-7 w-7 text-green-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
                        <CardDescription>{message}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Redirecting to login in 3 seconds...
                        </p>
                        <Button
                            className="w-full"
                            onClick={() => router.push('/')}
                        >
                            Sign In Now
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Lock className="h-7 w-7 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
                    <CardDescription>
                        Create a new password for your account
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {state === 'error' && message && (
                            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter new password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={state === 'loading'}
                                    required
                                    minLength={8}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Minimum 8 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={state === 'loading'}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={state === 'loading'}
                        >
                            {state === 'loading' ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>

                        <div className="text-center text-sm text-muted-foreground">
                            <Link href="/" className="text-primary hover:underline font-medium">
                                <ArrowLeft className="inline-block mr-1 h-3 w-3" />
                                Back to Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <ErrorBoundary name="Reset Password">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            }>
                <ResetPasswordContent />
            </Suspense>
        </ErrorBoundary>
    )
}
