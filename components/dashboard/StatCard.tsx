
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react"

interface StatCardProps {
    title: string
    value: string
    change?: string
    trend?: 'up' | 'down' | 'neutral'
    icon?: React.ReactNode
}

export function StatCard({ title, value, change, trend, icon }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon || <Activity className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && (
                    <p className={`text-xs ${trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground'} flex items-center mt-1`}>
                        {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : trend === 'down' ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                        {change}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
