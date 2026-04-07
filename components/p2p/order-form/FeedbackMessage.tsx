'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { CheckCircle2, AlertCircle } from 'lucide-react'

interface FeedbackMessageProps {
  message: string
  isSuccess: boolean
}

export function FeedbackMessage({
  message,
  isSuccess,
}: FeedbackMessageProps) {
  if (!message) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl p-4 text-sm',
        isSuccess
          ? 'border border-emerald-500/20 bg-emerald-500/10 text-emerald-700'
          : 'border border-rose-500/20 bg-rose-500/10 text-rose-700'
      )}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
      )}
      <span className="leading-relaxed">{message}</span>
    </div>
  )
}
