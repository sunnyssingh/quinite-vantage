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
  Activity
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'react-hot-toast'

export default function AnalyticsPage() {
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
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-purple-100 text-purple-800',
      'converted': 'bg-green-100 text-green-800',
      'lost': 'bg-gray-100 text-gray-800',
      'scheduled': 'bg-blue-100 text-blue-800',
      'running': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 mt-1">Track your performance and conversion metrics</p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2 w-full md:w-auto"
        >
          <Activity className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Leads */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All leads in database
            </p>
          </CardContent>
        </Card>

        {/* Total Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview?.totalCalls || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calls made by AI agent
            </p>
          </CardContent>
        </Card>

        {/* Transferred Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transferred to Human</CardTitle>
            <PhoneForwarded className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview?.totalTransferred || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Successful transfers
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview?.overview?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Calls transferred to human
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lead Status Distribution</CardTitle>
            <CardDescription>Breakdown of leads by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.leadsByStatus && Object.entries(overview.leadsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusBadgeColor(status)}>
                      {status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium">{count}</div>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
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

        {/* Call Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Call Status Distribution</CardTitle>
            <CardDescription>Breakdown of calls by outcome</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overview?.callStatusCounts && Object.entries(overview.callStatusCounts).map(([status, count]) => {
                const statusLabels = {
                  'not_called': 'Not Called',
                  'called': 'Called',
                  'transferred': 'Transferred',
                  'no_answer': 'No Answer',
                  'voicemail': 'Voicemail'
                }
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">{statusLabels[status]}</div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">{count}</div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
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
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
          <CardDescription>AI calling agent performance by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No campaigns yet</p>
              <p className="text-sm mt-2">Create campaigns to see performance metrics</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Calls</TableHead>
                    <TableHead className="text-right">Transferred</TableHead>
                    <TableHead className="text-right">Conversion Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.map(campaign => (
                    <TableRow key={campaign.id}>
                      <TableCell className="font-medium">{campaign.name}</TableCell>
                      <TableCell>
                        {campaign.project?.name || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(campaign.status)}>
                          {campaign.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{campaign.total_calls || 0}</TableCell>
                      <TableCell className="text-right">{campaign.transferred_calls || 0}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">
                          {campaign.conversion_rate || 0}%
                        </span>
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
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest lead updates</CardDescription>
        </CardHeader>
        <CardContent>
          {overview?.recentActivity && overview.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {overview.recentActivity.map(lead => (
                <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <Activity className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(lead.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusBadgeColor(lead.status)}>
                      {lead.status}
                    </Badge>
                    {lead.call_status && (
                      <Badge variant="outline">
                        {lead.call_status.replace('_', ' ')}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No recent activity
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
