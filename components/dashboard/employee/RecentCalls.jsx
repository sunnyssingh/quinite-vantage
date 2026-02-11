'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Phone, PhoneForwarded, Clock, FileText } from 'lucide-react'
import Link from 'next/link'

export function RecentCalls({ calls = [] }) {
    const getStatusColor = (status) => {
        const colors = {
            'completed': 'bg-green-100 text-green-800',
            'failed': 'bg-red-100 text-red-800',
            'busy': 'bg-yellow-100 text-yellow-800',
            'no_answer': 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
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
                    <Phone className="w-5 h-5" />
                    Recent Calls ({calls.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {calls.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Phone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No recent calls</p>
                        <p className="text-sm mt-1">Your call history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {calls.map((call) => (
                            <div
                                key={call.id}
                                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                            >
                                <div className="mt-1">
                                    {call.transferred ? (
                                        <PhoneForwarded className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Phone className="w-5 h-5 text-blue-600" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <div>
                                            <div className="font-medium truncate">
                                                {call.leadName}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {call.leadPhone}
                                            </div>
                                        </div>
                                        <Badge className={getStatusColor(call.status)}>
                                            {call.status}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDuration(call.duration)}
                                        </div>
                                        <div>{formatTimestamp(call.timestamp)}</div>
                                        {call.transferred && (
                                            <Badge variant="outline" className="text-xs">
                                                Transferred
                                            </Badge>
                                        )}
                                    </div>
                                    {call.notes && (
                                        <div className="mt-2 text-xs text-muted-foreground flex items-start gap-1">
                                            <FileText className="w-3 h-3 mt-0.5" />
                                            <span className="line-clamp-2">{call.notes}</span>
                                        </div>
                                    )}
                                </div>
                                {call.leadId && (
                                    <Link href={`/dashboard/admin/crm/leads?leadId=${call.leadId}`}>
                                        <Button variant="ghost" size="sm">
                                            View Lead
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
