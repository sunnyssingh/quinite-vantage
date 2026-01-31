'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function ComingUpNextCard({ tasks = [] }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'No date'
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/30'
            case 'in progress': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30'
            case 'overdue': return 'text-red-600 bg-red-50 dark:bg-red-900/30'
            default: return 'text-gray-600 bg-gray-50 dark:bg-gray-800'
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <CardTitle className="text-base font-semibold">Coming Up Next</CardTitle>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                {tasks.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No upcoming tasks
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="space-y-1">
                                <h4 className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                                    {task.title}
                                </h4>
                                <div className="grid grid-cols-[100px_1fr] md:grid-cols-[120px_1fr] gap-2 text-xs">
                                    <span className="text-muted-foreground">Activity Type</span>
                                    <span className="font-medium text-orange-500">Tasks</span>

                                    <span className="text-muted-foreground">Due Date</span>
                                    <span className="font-medium text-foreground">{formatDate(task.due_date)}</span>

                                    <span className="text-muted-foreground">Status</span>
                                    <span className={`font-medium w-fit px-2 py-0.5 rounded-full ${getStatusColor(task.status)}`}>
                                        {task.status || 'Not Started'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
