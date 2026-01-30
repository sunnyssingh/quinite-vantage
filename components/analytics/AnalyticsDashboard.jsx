'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    TrendingUp,
    Users,
    Phone,
    PhoneForwarded,
    BarChart3,
    Activity,
    ArrowRight
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

export default function AnalyticsDashboard() {
    const [overview, setOverview] = useState(null)
    const [campaigns, setCampaigns] = useState([])
    const [loading, setLoading] = useState(true)

    const [isRefreshing, setIsRefreshing] = useState(false)

    useEffect(() => {
        fetchAnalytics()
        // Auto-refresh every 30 seconds
        const interval = setInterval(() => fetchAnalytics(), 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchAnalytics = async (isManual = false) => {
        try {
            if (isManual) setIsRefreshing(true)
            // Don't set loading to true on background refreshes if data exists
            else if (!overview) setLoading(true)

            // Fetch overview
            const overviewRes = await fetch('/api/analytics/overview', { cache: 'no-store' })
            if (overviewRes.ok) {
                const data = await overviewRes.json()
                setOverview(data)
            }

            // Fetch campaigns
            const campaignsRes = await fetch('/api/analytics/campaigns', { cache: 'no-store' })
            if (campaignsRes.ok) {
                const data = await campaignsRes.json()
                setCampaigns(data.campaigns || [])
            }

            if (isManual) {
                toast.success("Dashboard Refreshed")
            }
        } catch (err) {
            console.error('Error fetching analytics:', err)
            if (isManual) {
                toast.error("Refresh Failed: Could not load latest data.")
            }
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    const handleRefresh = () => {
        fetchAnalytics(true)
    }

    const getStatusBadgeColor = (status) => {
        // Minimal outline/subtle styles
        return 'bg-secondary text-secondary-foreground hover:bg-secondary/80 font-normal border-transparent shadow-none'
    }

    if (loading && !overview) {
        return (
            <div className="p-6 space-y-6">
                <div>
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-4 w-80 mt-2" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-4 rounded" />
                            </div>
                            <Skeleton className="h-8 w-16 mb-2" />
                            <Skeleton className="h-3 w-32" />
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[...Array(2)].map((_, i) => (
                        <div key={i} className="border rounded-lg p-6">
                            <Skeleton className="h-6 w-48 mb-2" />
                            <Skeleton className="h-4 w-64 mb-4" />
                            <div className="space-y-3">
                                {[...Array(4)].map((_, j) => (
                                    <div key={j} className="flex justify-between items-center">
                                        <Skeleton className="h-6 w-20" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-4 w-8" />
                                            <Skeleton className="h-2 w-32" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
                    <p className="text-muted-foreground mt-1">Track your performance and conversion metrics</p>
                </div>
                <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2 w-full md:w-auto h-9 text-xs"
                >
                    <Activity className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Leads */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{overview?.overview?.totalLeads || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All leads in database
                        </p>
                    </CardContent>
                </Card>

                {/* Total Calls */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{overview?.overview?.totalCalls || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Calls made by AI agent
                        </p>
                    </CardContent>
                </Card>

                {/* Transferred Calls */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Transferred</CardTitle>
                        <PhoneForwarded className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{overview?.overview?.totalTransferred || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Successful transfers
                        </p>
                    </CardContent>
                </Card>

                {/* Conversion Rate */}
                <Card className="rounded-xl border-border bg-card shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground">{overview?.overview?.conversionRate || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Calls transferred to human
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Lead Status & Call Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Lead Status</CardTitle>
                        <CardDescription>Breakdown by current status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {overview?.leadsByStatus && Object.entries(overview.leadsByStatus).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="capitalize text-foreground font-medium">{status}</span>
                                    </div>
                                    <div className="flex items-center gap-3 w-1/2 justify-end">
                                        <div className="text-muted-foreground text-xs w-6 text-right">{count}</div>
                                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                            <div
                                                className="bg-primary h-full rounded-full"
                                                style={{
                                                    width: `${overview.overview.totalLeads > 0 ? (count / overview.overview.totalLeads * 100) : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg font-medium">Call Outcome</CardTitle>
                        <CardDescription>Breakdown by call result</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {overview?.callStatusCounts && Object.entries(overview.callStatusCounts).map(([status, count]) => {
                                const statusLabels = {
                                    'not_called': 'Not Called',
                                    'called': 'Called',
                                    'transferred': 'Transferred',
                                    'no_answer': 'No Answer',
                                    'voicemail': 'Voicemail'
                                }
                                return (
                                    <div key={status} className="flex items-center justify-between text-sm">
                                        <div className="text-foreground capitalize font-medium">{statusLabels[status] || status}</div>
                                        <div className="flex items-center gap-3 w-1/2 justify-end">
                                            <div className="text-muted-foreground text-xs w-6 text-right">{count}</div>
                                            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-foreground h-full rounded-full opacity-80"
                                                    style={{
                                                        width: `${overview.overview.totalLeads > 0 ? (count / overview.overview.totalLeads * 100) : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Performance */}
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Campaign Performance</CardTitle>
                    <CardDescription>Metrics by active campaign</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No campaigns found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead className="w-[200px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campaign</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project</TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calls</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transfers</TableHead>
                                        <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conv. Rate</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map(campaign => (
                                        <TableRow key={campaign.id} className="hover:bg-muted/30 border-border">
                                            <TableCell className="font-medium text-foreground text-sm">{campaign.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {campaign.project?.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-normal text-xs bg-transparent border-border text-foreground">
                                                    {campaign.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">{campaign.total_calls || 0}</TableCell>
                                            <TableCell className="text-right text-sm text-muted-foreground">{campaign.transferred_calls || 0}</TableCell>
                                            <TableCell className="text-right text-sm font-medium text-foreground">
                                                {campaign.conversion_rate || 0}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-border shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg font-medium">Recent Activity</CardTitle>
                    <CardDescription>Latest lead updates</CardDescription>
                </CardHeader>
                <CardContent>
                    {overview?.recentActivity && overview.recentActivity.length > 0 ? (
                        <div className="space-y-3">
                            {overview.recentActivity.map(lead => (
                                <div key={lead.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-4 h-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium text-sm text-foreground">{lead.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(lead.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Badge variant="outline" className="font-normal text-xs bg-transparent border-border text-muted-foreground">
                                            {lead.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent activity
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
