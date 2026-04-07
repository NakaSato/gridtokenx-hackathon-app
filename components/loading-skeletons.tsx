'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function PageLoadingSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 space-y-6">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="grid w-full max-w-2xl gap-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  )
}

export function CardLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-32 w-full rounded-xl" />
    </div>
  )
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function ChartLoadingSkeleton() {
  return (
    <div className="flex h-[300px] w-full items-center justify-center rounded-xl border border-border bg-muted/10">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex space-x-1">
          <Skeleton className="h-8 w-2 rounded-full" />
          <Skeleton className="h-12 w-2 rounded-full" />
          <Skeleton className="h-6 w-2 rounded-full" />
          <Skeleton className="h-10 w-2 rounded-full" />
          <Skeleton className="h-14 w-2 rounded-full" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  )
}
