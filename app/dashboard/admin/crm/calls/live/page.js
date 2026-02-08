'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, Users, Clock, TrendingUp, PhoneOff, PhoneForwarded, Activity, Sparkles } from 'lucide-react'
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Live Call Monitor
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                                Real-time command center for your AI workforce
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full shadow-sm">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                        <span className="text-xs font-medium text-green-700">Live</span>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Active Calls */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Phone className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-blue-100 text-xs md:text-sm font-medium">Active Calls</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{activeCalls.length}</p>
                            <p className="text-blue-100 text-xs">In progress right now</p>
                        </div>
                    </div>
                </Card>

                {/* Agents Available */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Users className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                {agentStats.onCall} on call
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-purple-100 text-xs md:text-sm font-medium">Agents Available</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{agentStats.available}</p>
                            <p className="text-purple-100 text-xs">Ready to handle calls</p>
                        </div>
                    </div>
                </Card>

                {/* Queue */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                {queueStats.processing} processing
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-amber-100 text-xs md:text-sm font-medium">Queue</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{queueStats.queued}</p>
                            <p className="text-amber-100 text-xs">Waiting to be called</p>
                        </div>
                    </div>
                </Card>

                {/* Failed */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-red-500 to-red-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <PhoneOff className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-red-100 text-xs md:text-sm font-medium">Failed</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{queueStats.failed}</p>
                            <p className="text-red-100 text-xs">Requires attention</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Active Calls Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        Active Calls
                        <Badge variant="secondary" className="ml-2">{activeCalls.length}</Badge>
                    </CardTitle>
                    <CardDescription>Real-time monitoring of ongoing calls</CardDescription>
                </CardHeader>
                <CardContent>
                    {activeCalls.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="p-4 bg-gray-100 rounded-full mb-4">
                                <Phone className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Calls</h3>
                            <p className="text-sm text-gray-500">Calls will appear here when they start</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeCalls.map((call) => (
                                <Card key={call.id} className="border-2 hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-base font-semibold text-gray-900">
                                                    {call.lead?.name || 'Unknown Lead'}
                                                </CardTitle>
                                                <p className="text-sm text-gray-500">{call.lead?.phone || call.callee_number}</p>
                                            </div>
                                            <Badge
                                                className={`${getStatusColor(call.call_status)} text-white`}
                                            >
                                                {call.call_status === 'in_progress' ? 'In Progress' : 'Ringing'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {/* Duration */}
                                        <div className="flex items-center gap-2 text-sm">
                                            <Clock className="w-4 h-4 text-gray-400" />
                                            <span className="text-gray-600">Duration:</span>
                                            <span className="font-medium text-gray-900">{getCallDuration(call.started_at)}</span>
                                        </div>

                                        {/* Campaign */}
                                        {call.campaign && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">Campaign:</span>
                                                <span className="font-medium text-gray-900 truncate">{call.campaign.name}</span>
                                            </div>
                                        )}

                                        {/* Sentiment */}
                                        {call.sentiment_score !== null && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Activity className="w-4 h-4 text-gray-400" />
                                                <span className="text-gray-600">Sentiment:</span>
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${call.sentiment_score > 0.6 ? 'bg-green-500' :
                                                            call.sentiment_score > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${call.sentiment_score * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Transfer Status */}
                                        {call.transferred && (
                                            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md">
                                                <PhoneForwarded className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-700">Transferred to Agent</span>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Queue Management */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Call Queue
                        </CardTitle>
                        <CardDescription>Pending calls waiting to be processed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div>
                                    <p className="text-sm font-medium text-yellow-900">Queued</p>
                                    <p className="text-2xl font-bold text-yellow-700">{queueStats.queued}</p>
                                </div>
                                <Clock className="w-8 h-8 text-yellow-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Processing</p>
                                    <p className="text-2xl font-bold text-blue-700">{queueStats.processing}</p>
                                </div>
                                <Activity className="w-8 h-8 text-blue-600" />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                                <div>
                                    <p className="text-sm font-medium text-red-900">Failed</p>
                                    <p className="text-2xl font-bold text-red-700">{queueStats.failed}</p>
                                </div>
                                <PhoneOff className="w-8 h-8 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Agent Availability
                        </CardTitle>
                        <CardDescription>Current agent status and capacity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                <div>
                                    <p className="text-sm font-medium text-green-900">Available Agents</p>
                                    <p className="text-2xl font-bold text-green-700">{agentStats.available}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <Users className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div>
                                    <p className="text-sm font-medium text-purple-900">On Call</p>
                                    <p className="text-2xl font-bold text-purple-700">{agentStats.onCall}</p>
                                </div>
                                <Phone className="w-8 h-8 text-purple-600" />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Capacity</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {agentStats.available + agentStats.onCall > 0
                                            ? Math.round((agentStats.onCall / (agentStats.available + agentStats.onCall)) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${agentStats.available + agentStats.onCall > 0
                                                ? (agentStats.onCall / (agentStats.available + agentStats.onCall)) * 100
                                                : 0}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

