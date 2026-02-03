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
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
                <div className="relative p-6 bg-white rounded-full shadow-lg border border-gray-100">
                    <Activity className="w-12 h-12 text-blue-600" />
                </div>
            </div>

            <div className="space-y-2 max-w-lg">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Live Call Monitor</h1>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">Coming Soon</Badge>
                </div>
                <p className="text-lg text-gray-500">
                    We're building a real-time command center for your AI workforce. Watch active calls, monitor agent performance, and manage queues instantly.
                </p>
            </div>

            <Card className="max-w-md w-full border-dashed border-2 shadow-none bg-gray-50/50 backdrop-blur">
                <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wider">Features In Development</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <Phone className="w-4 h-4 text-green-600" />
                            </div>
                            <span className="font-medium">Real-time Call Streaming & Status</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                <Users className="w-4 h-4 text-purple-600" />
                            </div>
                            <span className="font-medium">Live Agent Availability Board</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-orange-600" />
                            </div>
                            <span className="font-medium">Interactive Queue Management</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

