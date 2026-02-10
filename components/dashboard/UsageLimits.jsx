'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FolderKanban, Users, Contact, TrendingUp, AlertCircle } from 'lucide-react'

export default function UsageLimits({ organizationId }) {
    const [usage, setUsage] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchUsage()
    }, [organizationId])

    const fetchUsage = async () => {
        try {
            const response = await fetch(`/api/billing/usage?organization_id=${organizationId}`)
            if (response.ok) {
                const data = await response.json()
                setUsage(data.usage)
            }
        } catch (error) {
            console.error('Error fetching usage:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Usage & Limits</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                </CardContent>
            </Card>
        )
    }

    if (!usage) {
        return null
    }

    const getProgressColor = (percentage) => {
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 75) return 'bg-yellow-500'
        return 'bg-blue-500'
    }

    const limits = [
        {
            icon: FolderKanban,
            label: 'Projects',
            current: usage.projects.current,
            limit: usage.projects.limit,
            percentage: usage.projects.percentage,
            color: 'blue'
        },
        {
            icon: Contact,
            label: 'Leads',
            current: usage.leads.current,
            limit: usage.leads.limit,
            percentage: usage.leads.percentage,
            color: 'green'
        },
        {
            icon: Users,
            label: 'Users',
            current: usage.users.current,
            limit: usage.users.limit,
            percentage: usage.users.percentage,
            color: 'purple'
        }
    ]

    const isNearLimit = limits.some(l => l.percentage >= 75)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Usage & Limits</CardTitle>
                        <CardDescription>
                            Current plan: <Badge variant="outline">{usage.plan}</Badge>
                        </CardDescription>
                    </div>
                    {isNearLimit && (
                        <AlertCircle className="w-5 h-5 text-yellow-500" />
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {limits.map((item) => {
                    const Icon = item.icon
                    const isUnlimited = item.limit === null
                    const percentage = isUnlimited ? 0 : item.percentage

                    return (
                        <div key={item.label} className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 text-${item.color}-600`} />
                                    <span className="text-sm font-medium text-gray-700">
                                        {item.label}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-600">
                                    {item.current} / {isUnlimited ? '∞' : item.limit}
                                </span>
                            </div>

                            {!isUnlimited && (
                                <>
                                    <Progress
                                        value={percentage}
                                        className="h-2"
                                    />

                                    {percentage >= 90 && (
                                        <p className="text-xs text-red-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Limit almost reached! Upgrade to add more.
                                        </p>
                                    )}
                                    {percentage >= 75 && percentage < 90 && (
                                        <p className="text-xs text-yellow-600">
                                            {Math.round(100 - percentage)}% remaining
                                        </p>
                                    )}
                                </>
                            )}
                        </div>
                    )
                })}

                {usage.plan === 'Free' && (
                    <div className="pt-4 border-t">
                        <Button className="w-full" variant="default">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade to Pro
                        </Button>
                        <p className="text-xs text-center text-gray-500 mt-2">
                            Get 10 projects, 5,000 leads, and unlimited users
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
