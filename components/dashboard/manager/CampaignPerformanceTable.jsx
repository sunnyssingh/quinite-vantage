'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, TrendingUp, Eye, Pause } from 'lucide-react'
import Link from 'next/link'

export function CampaignPerformanceTable({ campaigns = [] }) {
    const getStatusColor = (status) => {
        const colors = {
            'active': 'bg-green-100 text-green-800',
            'paused': 'bg-yellow-100 text-yellow-800',
            'completed': 'bg-gray-100 text-gray-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Megaphone className="w-5 h-5" />
                    Campaign Performance
                </CardTitle>
            </CardHeader>
            <CardContent>
                {campaigns.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Megaphone className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No active campaigns</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Campaign
                                    </th>
                                    <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Leads
                                    </th>
                                    <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Calls
                                    </th>
                                    <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Conversions
                                    </th>
                                    <th className="text-center py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Rate
                                    </th>
                                    <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="border-b hover:bg-muted/50 transition-colors">
                                        <td className="py-3 px-4">
                                            <div className="font-medium">{campaign.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(campaign.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <Badge className={getStatusColor(campaign.status)}>
                                                {campaign.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium">
                                            {campaign.activeLeads}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            {campaign.callsMade}
                                        </td>
                                        <td className="py-3 px-4 text-center font-medium text-green-600">
                                            {campaign.conversions}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <TrendingUp className="w-3 h-3 text-green-600" />
                                                <span className="font-semibold">{campaign.conversionRate}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/dashboard/admin/crm/campaigns/${campaign.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
