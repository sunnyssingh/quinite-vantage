'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Phone, Search, Calendar, Clock, User, Building2,
    PhoneForwarded, PhoneOff, Activity, MessageSquare,
    Flag, ExternalLink, Sparkles, TrendingUp
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDistanceToNow, format } from 'date-fns'

import { usePermission } from '@/contexts/PermissionContext'
import PermissionTooltip from '@/components/permissions/PermissionTooltip'
import { Lock } from 'lucide-react'

export default function CallHistory() {
    const [calls, setCalls] = useState([])
    const [filteredCalls, setFilteredCalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCall, setSelectedCall] = useState(null)
    const [analyzing, setAnalyzing] = useState(null)
    const [user, setUser] = useState(null)
    const supabase = createClient()

    // Permissions
    const canViewAll = usePermission('view_all_calls')
    const canViewTeam = usePermission('view_team_calls') // Placeholder for future team logic
    const canViewOwn = usePermission('view_own_calls')

    // If user has view_all, they satisfy the requirement. 
    // If not, but they have view_own, they satisfy it (with filtering).
    const hasAccess = canViewAll || canViewTeam || canViewOwn

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            setUser(user)
        }
        getUser()
    }, [])

    useEffect(() => {
        if (user && hasAccess) {
            fetchCallHistory()
        } else if (!loading && !hasAccess) {
            // If we're done loading user and determined no access, stop loading
            // actually loading is controlled by fetchCallHistory, so we need to set it false if we don't fetch
            setLoading(false)
        }
    }, [user, hasAccess])

    useEffect(() => {
        filterCalls()
    }, [searchTerm, calls])

    const fetchCallHistory = async () => {
        if (!user) return

        let query = supabase
            .from('call_logs')
            .select(`
                *,
                lead:leads(id, name, phone, email),
                campaign:campaigns(id, name),
                insights:conversation_insights(
                    id,
                    overall_sentiment,
                    sentiment_label,
                    interest_level,
                    objections,
                    budget_mentioned,
                    priority_score
                )
            `)
            .order('created_at', { ascending: false })
            .limit(100)

        // Apply permission filters
        if (!canViewAll && !canViewTeam && canViewOwn) {
            // Only view own calls
            // Assuming 'user_id' is the column name for the caller
            query = query.eq('user_id', user.id)
        }

        const { data, error } = await query

        if (!error && data) {
            setCalls(data)
            setFilteredCalls(data)
        }
        setLoading(false)
    }

    const filterCalls = () => {
        if (!searchTerm) {
            setFilteredCalls(calls)
            return
        }

        const filtered = calls.filter(call =>
            call.lead?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.lead?.phone?.includes(searchTerm) ||
            call.campaign?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            call.call_status?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        setFilteredCalls(filtered)
    }

    const analyzeCall = async (callId) => {
        setAnalyzing(callId)
        try {
            const response = await fetch(`/api/calls/${callId}/analyze`, {
                method: 'POST'
            })

            if (response.ok) {
                // Refresh the call data
                await fetchCallHistory()
                alert('Sentiment analysis completed!')
            } else {
                const error = await response.json()
                alert(`Analysis failed: ${error.error}`)
            }
        } catch (error) {
            console.error('Analysis error:', error)
            alert('Failed to analyze call')
        } finally {
            setAnalyzing(null)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800'
            case 'disconnected': return 'bg-gray-100 text-gray-800'
            case 'transferred': return 'bg-blue-100 text-blue-800'
            case 'failed': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getSentimentColor = (sentiment) => {
        if (!sentiment) return 'text-gray-400'
        if (sentiment > 0.3) return 'text-green-600'
        if (sentiment < -0.3) return 'text-red-600'
        return 'text-yellow-600'
    }

    const formatDuration = (seconds) => {
        if (!seconds || seconds === 0) return '0s'
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
    }

    if (!hasAccess && !loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900">Access Restricted</h2>
                <p className="text-gray-500 mt-2 text-center max-w-md">
                    You do not have permission to view call history.
                </p>
            </div>
        )
    }

    if (loading) {
        return <CallHistorySkeleton />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <Phone className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Call History
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                                View and analyze past calls
                            </p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-purple-200 text-purple-700 bg-purple-50 w-fit">
                    {calls.length} Total Calls
                </Badge>
            </div>

            {/* Search */}
            <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search by lead name, phone, campaign, or status..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Completed */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Phone className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-white/60" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-green-100 text-xs md:text-sm font-medium">Completed</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">
                                {calls.filter(c => c.call_status === 'completed' || c.call_status === 'transferred').length}
                            </p>
                            <p className="text-green-100 text-xs">Successfully finished</p>
                        </div>
                    </div>
                </Card>

                {/* Transferred */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <PhoneForwarded className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-blue-100 text-xs md:text-sm font-medium">Transferred</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">
                                {calls.filter(c => c.transferred).length}
                            </p>
                            <p className="text-blue-100 text-xs">Escalated to agents</p>
                        </div>
                    </div>
                </Card>

                {/* Avg Duration */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Clock className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-purple-100 text-xs md:text-sm font-medium">Avg Duration</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">
                                {formatDuration(Math.round(calls.reduce((acc, c) => acc + (c.duration || 0), 0) / calls.length))}
                            </p>
                            <p className="text-purple-100 text-xs">Average call length</p>
                        </div>
                    </div>
                </Card>

                {/* With Insights */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-amber-100 text-xs md:text-sm font-medium">With Insights</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">
                                {calls.filter(c => c.insights && c.insights.length > 0).length}
                            </p>
                            <p className="text-amber-100 text-xs">AI analyzed calls</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Calls List */}
            <Card>
                <CardHeader>
                    <CardTitle>Call Records</CardTitle>
                    <CardDescription>
                        {filteredCalls.length} {filteredCalls.length === 1 ? 'call' : 'calls'} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredCalls.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <PhoneOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No calls found</p>
                            <p className="text-sm">Try adjusting your search criteria</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredCalls.map((call) => (
                                <div
                                    key={call.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        {/* Left: Call Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg text-gray-900">
                                                    {call.lead?.name || 'Unknown Lead'}
                                                </h3>
                                                <Badge className={getStatusColor(call.call_status)}>
                                                    {call.call_status?.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                                {call.transferred && call.call_status !== 'transferred' && (
                                                    <Badge variant="outline" className="text-blue-600 border-blue-600">
                                                        <PhoneForwarded className="h-3 w-3 mr-1" />
                                                        Transferred
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {call.lead?.phone || call.callee_number}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Building2 className="h-3 w-3" />
                                                    {call.campaign?.name || 'No Campaign'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDuration(call.duration)}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {format(new Date(call.created_at), 'MMM d, yyyy h:mm a')}
                                                </div>
                                            </div>

                                            {/* Insights Preview */}
                                            {call.insights && call.insights.length > 0 ? (
                                                <div className="flex items-center gap-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <Activity className={`h-4 w-4 ${getSentimentColor(call.insights[0].overall_sentiment)}`} />
                                                        <span className="font-medium">
                                                            Sentiment: {call.insights[0].sentiment_label || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <User className="h-4 w-4 text-gray-400" />
                                                        <span>
                                                            Interest: {call.insights[0].interest_level || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {call.insights[0].priority_score && (
                                                        <div className="flex items-center gap-1">
                                                            <Flag className="h-4 w-4 text-yellow-500" />
                                                            <span>Priority: {call.insights[0].priority_score}/100</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-gray-400 italic">
                                                    No insights generated yet
                                                </div>
                                            )}

                                            {/* Disconnect Reason */}
                                            {call.disconnect_reason && (
                                                <div className="mt-2 text-sm text-gray-600">
                                                    <span className="font-medium">Reason:</span> {call.disconnect_reason.replace('_', ' ')}
                                                </div>
                                            )}
                                        </div>

                                        {/* Right: Actions */}
                                        <div className="flex flex-col gap-2 ml-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setSelectedCall(selectedCall?.id === call.id ? null : call)}
                                            >
                                                <MessageSquare className="h-4 w-4 mr-1" />
                                                {selectedCall?.id === call.id ? 'Hide' : 'View'} Transcript
                                            </Button>

                                            {(!call.insights || call.insights.length === 0) && call.conversation_transcript && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => analyzeCall(call.id)}
                                                    disabled={analyzing === call.id}
                                                >
                                                    <Activity className="h-4 w-4 mr-1" />
                                                    {analyzing === call.id ? 'Analyzing...' : 'Analyze'}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Transcript Expansion */}
                                    {selectedCall?.id === call.id && call.conversation_transcript && (
                                        <div className="mt-4 pt-4 border-t">
                                            <h4 className="font-semibold text-sm text-gray-700 mb-2">Conversation Transcript</h4>
                                            <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                                                    {call.conversation_transcript}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function CallHistorySkeleton() {
    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-16" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-6 w-48" />
                                        <Skeleton className="h-5 w-24 rounded-full" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                </div>
                                <div className="ml-4 space-y-2">
                                    <Skeleton className="h-8 w-32" />
                                    <Skeleton className="h-8 w-24" />
                                </div>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
