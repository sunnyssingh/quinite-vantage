'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
    Phone,
    PhoneForwarded,
    PhoneOff,
    Clock,
    TrendingUp,
    Users,
    CheckCircle2,
    XCircle,
    AlertCircle
} from 'lucide-react'

export default function CampaignProgressTracker({ campaignId }) {
    const [campaign, setCampaign] = useState(null)
    const [stats, setStats] = useState({
        totalLeads: 0,
        callsCompleted: 0,
        callsInProgress: 0,
        transferred: 0,
        failed: 0,
        queued: 0
    })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        fetchCampaignData()

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`campaign_${campaignId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'call_logs',
                filter: `campaign_id=eq.${campaignId}`
            }, () => {
                fetchCampaignData()
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'call_queue',
                filter: `campaign_id=eq.${campaignId}`
            }, () => {
                fetchCampaignData()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [campaignId])

    const fetchCampaignData = async () => {
        // Fetch campaign details
        const { data: campaignData } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', campaignId)
            .single()

        if (campaignData) {
            setCampaign(campaignData)
        }

        // Fetch total leads for this campaign's project
        const { data: leads } = await supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('project_id', campaignData?.project_id)

        // Fetch call logs stats
        const { data: callLogs } = await supabase
            .from('call_logs')
            .select('call_status, transferred')
            .eq('campaign_id', campaignId)

        // Fetch queue stats
        const { data: queueItems } = await supabase
            .from('call_queue')
            .select('status')
            .eq('campaign_id', campaignId)

        // Calculate stats
        const callStats = {
            totalLeads: leads?.length || 0,
            callsCompleted: callLogs?.filter(c => c.call_status === 'completed').length || 0,
            callsInProgress: callLogs?.filter(c => ['in_progress', 'ringing'].includes(c.call_status)).length || 0,
            transferred: callLogs?.filter(c => c.transferred).length || 0,
            failed: callLogs?.filter(c => c.call_status === 'failed').length || 0,
            queued: queueItems?.filter(q => q.status === 'queued').length || 0
        }

        setStats(callStats)
        setLoading(false)
    }

    const getProgressPercentage = () => {
        if (stats.totalLeads === 0) return 0
        return Math.round((stats.callsCompleted / stats.totalLeads) * 100)
    }

    const getTransferRate = () => {
        if (stats.callsCompleted === 0) return 0
        return Math.round((stats.transferred / stats.callsCompleted) * 100)
    }

    const getEstimatedCompletion = () => {
        if (stats.callsCompleted === 0 || stats.queued === 0) return 'N/A'

        // Assume 2 calls per second (from queue worker)
        const remainingCalls = stats.queued
        const estimatedSeconds = remainingCalls / 2
        const estimatedMinutes = Math.ceil(estimatedSeconds / 60)

        if (estimatedMinutes < 60) {
            return `~${estimatedMinutes} minutes`
        } else {
            const hours = Math.floor(estimatedMinutes / 60)
            const mins = estimatedMinutes % 60
            return `~${hours}h ${mins}m`
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Campaign Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">{campaign?.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{campaign?.description}</p>
                </div>
                <Badge
                    variant={campaign?.status === 'running' ? 'default' : 'secondary'}
                    className="text-sm"
                >
                    {campaign?.status?.toUpperCase()}
                </Badge>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Campaign Progress</CardTitle>
                    <CardDescription>
                        {stats.callsCompleted} of {stats.totalLeads} leads contacted
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Overall Progress</span>
                            <span className="font-semibold">{getProgressPercentage()}%</span>
                        </div>
                        <Progress value={getProgressPercentage()} className="h-3" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{stats.queued}</div>
                            <div className="text-xs text-gray-500">In Queue</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.callsInProgress}</div>
                            <div className="text-xs text-gray-500">Active Now</div>
                        </div>
                    </div>

                    {stats.queued > 0 && (
                        <div className="flex items-center justify-between pt-2 text-sm">
                            <span className="text-gray-600 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                Estimated completion
                            </span>
                            <span className="font-medium">{getEstimatedCompletion()}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Completed Calls */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.callsCompleted}
                                </p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-600 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                {/* Transferred */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Transferred</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.transferred}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {getTransferRate()}% rate
                                </p>
                            </div>
                            <PhoneForwarded className="h-8 w-8 text-blue-600 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                {/* Failed */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Failed</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.failed}
                                </p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-600 opacity-80" />
                        </div>
                    </CardContent>
                </Card>

                {/* In Progress */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">In Progress</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.callsInProgress}
                                </p>
                            </div>
                            <Phone className="h-8 w-8 text-yellow-600 opacity-80 animate-pulse" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Performance Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm text-gray-600 mb-1">Connection Rate</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.totalLeads > 0
                                    ? Math.round(((stats.callsCompleted + stats.callsInProgress) / stats.totalLeads) * 100)
                                    : 0}%
                            </div>
                            <Progress
                                value={stats.totalLeads > 0
                                    ? ((stats.callsCompleted + stats.callsInProgress) / stats.totalLeads) * 100
                                    : 0}
                                className="h-2 mt-2"
                            />
                        </div>

                        <div>
                            <div className="text-sm text-gray-600 mb-1">Transfer Rate</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {getTransferRate()}%
                            </div>
                            <Progress
                                value={getTransferRate()}
                                className="h-2 mt-2"
                            />
                        </div>

                        <div>
                            <div className="text-sm text-gray-600 mb-1">Success Rate</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {stats.callsCompleted > 0
                                    ? Math.round(((stats.callsCompleted - stats.failed) / stats.callsCompleted) * 100)
                                    : 0}%
                            </div>
                            <Progress
                                value={stats.callsCompleted > 0
                                    ? ((stats.callsCompleted - stats.failed) / stats.callsCompleted) * 100
                                    : 0}
                                className="h-2 mt-2"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
