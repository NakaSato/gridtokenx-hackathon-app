'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Lightbulb, CheckCircle2, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RecommendationsCardProps {
    recommendations?: string[]
    archetypeName?: string
    isLoading?: boolean
    className?: string
}

export function RecommendationsCard({
    recommendations = [],
    archetypeName,
    isLoading,
    className
}: RecommendationsCardProps) {
    if (isLoading) {
        return (
            <Card className={className}>
                <CardHeader className="pb-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={cn("border-primary/20", className)}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    Personalized Recommendations
                </CardTitle>
                <CardDescription>
                    Based on your {archetypeName || 'energy'} profile
                </CardDescription>
            </CardHeader>
            <CardContent>
                {recommendations.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="font-medium">No recommendations at this time</p>
                        <p className="text-sm">Your energy profile looks optimized!</p>
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {recommendations.map((rec, idx) => (
                            <li
                                key={idx}
                                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <ArrowRight className="h-3 w-3 text-primary" />
                                </div>
                                <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    )
}
