import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatsCard({
    title,
    value,
    change,
    trend = 'up',
    icon: Icon,
    bgColor = 'bg-blue-50',
    iconColor = 'text-blue-600',
    borderColor = 'border-l-blue-500'
}) {
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown
    const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600'

    return (
        <Card className={`border-l-4 ${borderColor} hover:shadow-lg transition-shadow duration-200`}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                            {title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                            {value}
                        </p>
                        {change && (
                            <p className={`text-xs ${trendColor} mt-2 flex items-center gap-1`}>
                                <TrendIcon className="w-3 h-3" />
                                <span>{change} from last month</span>
                            </p>
                        )}
                    </div>
                    <div className={`p-3 ${bgColor} rounded-full`}>
                        <Icon className={`w-6 h-6 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
