'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, Phone, PhoneForwarded } from 'lucide-react'

export function ActivityFeed({ activities = [] }) {
    const getActivityIcon = (type) => {
        switch (type) {
            case 'transfer':
                return <PhoneForwarded className="w-4 h-4 text-green-600" />
            case 'call':
                return <Phone className="w-4 h-4 text-blue-600" />
            default:
                return <Activity className="w-4 h-4 text-gray-600" />
        }
    }

    const getStatusColor = (status) => {
        const colors = {
            'completed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'busy': 'bg-yellow-100 text-yellow-800',
            'no_answer': 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp)
        const now = new Date()
        const diffMs = now - date
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`

        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours}h ago`

        return date.toLocaleDateString()
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Recent Activity
                </CardTitle>
            </CardHeader>
            <CardContent>
                {activities.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No recent activity</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <div className="mt-1">
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <div className="font-medium truncate">
                                                {activity.leadName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {activity.leadPhone}
                                            </div>
                                        </div>
                                        <Badge className={getStatusColor(activity.status)} variant="secondary">
                                            {activity.status}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                        {formatTimestamp(activity.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
