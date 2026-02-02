'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Users, Clock, TrendingUp, PhoneOff, PhoneForwarded, Activity } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function LiveCallMonitor() {
    const [activeCalls, setActiveCalls] = useState([])
    const [queueStats, setQueueStats] = useState({ queued: 0, processing: 0, failed: 0 })
    const [agentStats, setAgentStats] = useState({ available: 0, onCall: 0 })
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    // Fetch initial data
    useEffect(() => {
        fetchActiveCalls()
        fetchQueueStats()
        fetchAgentStats()
        setLoading(false)
    }, [])

    // Subscribe to real-time updates
    useEffect(() => {
        // Subscribe to call_logs changes
        const callLogsChannel = supabase
            .channel('call_logs_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'call_logs',
                filter: 'call_status=in.(in_progress,ringing)'
            }, (payload) => {
                console.log('Call log change:', payload)
                fetchActiveCalls()
            })
            .subscribe()

        // Subscribe to call_queue changes
        const queueChannel = supabase
            .channel('queue_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'call_queue'
            }, (payload) => {
                console.log('Queue change:', payload)
                fetchQueueStats()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(callLogsChannel)
            supabase.removeChannel(queueChannel)
        }
    }, [])

    const fetchActiveCalls = async () => {
        const { data, error } = await supabase
            .from('call_logs')
            .select(`
                *,
                lead:leads(id, name, phone, email),
                campaign:campaigns(id, name)
            `)
            .in('call_status', ['in_progress', 'ringing'])
            .order('created_at', { ascending: false })

        if (!error && data) {
            setActiveCalls(data)
        }
    }

    const fetchQueueStats = async () => {
        const { data, error } = await supabase
            .from('call_queue')
            .select('status')

        if (!error && data) {
            const stats = data.reduce((acc, item) => {
                acc[item.status] = (acc[item.status] || 0) + 1
                return acc
            }, {})

            setQueueStats({
                queued: stats.queued || 0,
                processing: stats.processing || 0,
                failed: stats.failed || 0
            })
        }
    }

    const fetchAgentStats = async () => {
        // Get agents currently on calls
        const { data: agentCalls } = await supabase
            .from('agent_calls')
            .select('agent_id')
            .is('ended_at', null)

        // Get total available agents
        const { data: agents } = await supabase
            .from('profiles')
            .select('id')
            .eq('role', 'employee')
            .not('phone', 'is', null)

        setAgentStats({
            available: (agents?.length || 0) - (agentCalls?.length || 0),
            onCall: agentCalls?.length || 0
        })
    }

    const getCallDuration = (startTime) => {
        if (!startTime) return '0s'
        return formatDistanceToNow(new Date(startTime), { addSuffix: false })
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'in_progress': return 'bg-green-500'
            case 'ringing': return 'bg-yellow-500'
            case 'transferred': return 'bg-blue-500'
            default: return 'bg-gray-500'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Live Call Monitor</h1>
                <p className="text-gray-500 mt-1">Real-time view of active calls and queue status</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Active Calls */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Calls</CardTitle>
                        <Phone className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCalls.length}</div>
                        <p className="text-xs text-muted-foreground">Currently in progress</p>
                    </CardContent>
                </Card>

                {/* Queue Size */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Queue</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{queueStats.queued}</div>
                        <p className="text-xs text-muted-foreground">
                            {queueStats.processing} processing, {queueStats.failed} failed
                        </p>
                    </CardContent>
                </Card>

                {/* Available Agents */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Agents</CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{agentStats.available}</div>
                        <p className="text-xs text-muted-foreground">
                            {agentStats.onCall} on call
                        </p>
                    </CardContent>
                </Card>

                {/* Success Rate */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {queueStats.queued + queueStats.processing > 0
                                ? Math.round((queueStats.processing / (queueStats.queued + queueStats.processing)) * 100)
                                : 0}%
                        </div>
                        <p className="text-xs text-muted-foreground">Call connection rate</p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Calls List */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Active Calls
                    </CardTitle>
                    <CardDescription>
                        Real-time view of ongoing conversations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {activeCalls.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <PhoneOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No active calls</p>
                            <p className="text-sm">Calls will appear here when they start</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {activeCalls.map((call) => (
                                <div
                                    key={call.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Status Indicator */}
                                        <div className="relative">
                                            <div className={`w-3 h-3 rounded-full ${getStatusColor(call.call_status)}`}>
                                                <div className={`absolute inset-0 rounded-full ${getStatusColor(call.call_status)} animate-ping opacity-75`}></div>
                                            </div>
                                        </div>

                                        {/* Call Info */}
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900">
                                                    {call.lead?.name || 'Unknown Lead'}
                                                </h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {call.call_status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {call.lead?.phone || call.callee_number}
                                                </span>
                                                <span>•</span>
                                                <span>{call.campaign?.name || 'No Campaign'}</span>
                                                {call.transferred && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1 text-blue-600">
                                                            <PhoneForwarded className="h-3 w-3" />
                                                            Transferred
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div className="text-right">
                                        <div className="text-lg font-semibold text-gray-900">
                                            {getCallDuration(call.created_at)}
                                        </div>
                                        <div className="text-xs text-gray-500">Duration</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
