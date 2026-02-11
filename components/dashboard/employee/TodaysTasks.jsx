'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react'

export function TodaysTasks({ tasks = [] }) {
    const getPriorityIcon = (priority) => {
        switch (priority) {
            case 'high':
                return <AlertTriangle className="w-4 h-4 text-red-600" />
            case 'medium':
                return <Clock className="w-4 h-4 text-yellow-600" />
            default:
                return <CheckCircle2 className="w-4 h-4 text-green-600" />
        }
    }

    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'bg-red-100 text-red-800',
            'medium': 'bg-yellow-100 text-yellow-800',
            'low': 'bg-green-100 text-green-800'
        }
        return colors[priority] || 'bg-gray-100 text-gray-800'
    }

    const formatDueDate = (dueDate) => {
        if (!dueDate) return 'No due date'
        const date = new Date(dueDate)
        const now = new Date()
        const diffMs = date - now
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

        if (diffHours < 0) return 'Overdue'
        if (diffHours < 24) return `Due in ${diffHours}h`

        const diffDays = Math.floor(diffHours / 24)
        return `Due in ${diffDays}d`
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Today's Tasks ({tasks.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50 text-green-500" />
                        <p>No pending tasks</p>
                        <p className="text-sm mt-1">You're all caught up!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <div className="mt-1">
                                    {getPriorityIcon(task.priority)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div>
                                            <div className="font-medium">
                                                {task.type === 'follow_up' ? 'Follow-up: ' : ''}
                                                {task.leadName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {task.leadPhone}
                                            </div>
                                        </div>
                                        <Badge className={getPriorityColor(task.priority)}>
                                            {task.priority}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatDueDate(task.dueDate)}
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
