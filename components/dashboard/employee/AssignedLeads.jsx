'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, Phone, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export function AssignedLeads({ leads = [] }) {
    const getPriorityColor = (priority) => {
        const colors = {
            'high': 'bg-red-100 text-red-800 border-red-200',
            'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'low': 'bg-green-100 text-green-800 border-green-200'
        }
        return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const formatDaysSince = (days) => {
        if (days === null) return 'Never contacted'
        if (days === 0) return 'Today'
        if (days === 1) return 'Yesterday'
        return `${days} days ago`
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    High Priority Leads ({leads.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                {leads.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No leads assigned</p>
                        <p className="text-sm mt-1">Great job! All leads are up to date</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leads.map((lead) => (
                            <div
                                key={lead.id}
                                className={`p-4 rounded-lg border-2 ${getPriorityColor(lead.priority)} hover:shadow-md transition-all`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className="font-semibold text-lg truncate">
                                                {lead.name}
                                            </div>
                                            <Badge
                                                style={{ backgroundColor: lead.statusColor }}
                                                className="text-white"
                                            >
                                                {lead.status}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3 h-3" />
                                                {lead.phone}
                                            </div>
                                            {lead.email && (
                                                <div className="truncate">{lead.email}</div>
                                            )}
                                            <div className="flex items-center gap-1 text-xs">
                                                <AlertCircle className="w-3 h-3" />
                                                Last contact: {formatDaysSince(lead.daysSinceContact)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Link href={`tel:${lead.phone}`}>
                                            <Button size="sm" className="w-full">
                                                <Phone className="w-4 h-4 mr-1" />
                                                Call
                                            </Button>
                                        </Link>
                                        <Link href={`/dashboard/admin/crm/leads?leadId=${lead.id}`}>
                                            <Button size="sm" variant="outline" className="w-full">
                                                View
                                            </Button>
                                        </Link>
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
