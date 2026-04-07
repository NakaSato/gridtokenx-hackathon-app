'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, RefreshCcw, Home, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  const [isResetting, setIsResetting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    console.error('[AppError]', error)
  }, [error])

  const handleReset = () => {
    setIsResetting(true)
    reset()
    // Reset the loading state after a short delay if reset doesn't cause unmount
    setTimeout(() => setIsResetting(false), 2000)
  }

  const copyErrorInfo = () => {
    const info = `Error: ${error.message}${error.digest ? `\nDigest: ${error.digest}` : ''}`
    navigator.clipboard.writeText(info)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="bg-destructive/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full animate-in zoom-in duration-300">
          <AlertTriangle className="h-8 w-8 text-destructive" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. We've logged this issue and our team will investigate.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-destructive/5 rounded-lg p-4 text-left space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-destructive">Error Details</p>
              <button
                onClick={copyErrorInfo}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Copy error details"
              >
                {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground break-all">
              {error.name}: {error?.message || 'Unknown error'}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Digest:</span> {error.digest}
              </p>
            )}
            {error.stack && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                  Stack trace
                </summary>
                <pre className="mt-2 max-h-32 overflow-auto rounded bg-background p-2 text-[10px] text-muted-foreground">
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        )}

        {error.digest && process.env.NODE_ENV !== 'development' && (
          <div className="bg-secondary/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Error ID:</span>{' '}
              <code className="rounded bg-background px-1 py-0.5">{error.digest}</code>
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Include this ID when contacting support
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={handleReset}
            disabled={isResetting}
            className={cn("gap-2", isResetting && "opacity-70")}
          >
            <RefreshCcw className={cn("h-4 w-4", isResetting && "animate-spin")} />
            {isResetting ? 'Retrying...' : 'Try Again'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          Need help?{' '}
          <a
            href="mailto:support@gridtokenx.com"
            className="text-primary hover:underline"
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  )
}
