'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Phone, Search, Calendar, Clock, User, Building2,
    PhoneForwarded, PhoneOff, TrendingUp, MessageSquare,
    Sparkles, ExternalLink
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function CallHistory() {
    const [calls, setCalls] = useState([])
    const [filteredCalls, setFilteredCalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCall, setSelectedCall] = useState(null)
    const [analyzing, setAnalyzing] = useState(null)
    const supabase = createClient()

    useEffect(() => {
        fetchCallHistory()
    }, [])

    useEffect(() => {
        filterCalls()
    }, [searchTerm, calls])

    const fetchCallHistory = async () => {
        const { data, error } = await supabase
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Call History</h1>
                    <p className="text-gray-500 mt-1">View and analyze past calls</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm">
                        {calls.length} Total Calls
                    </Badge>
                </div>
            </div>

            {/* Search */}
            <Card>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <Phone className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calls.filter(c => c.call_status === 'completed').length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Transferred</CardTitle>
                        <PhoneForwarded className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calls.filter(c => c.transferred).length}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                        <Clock className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatDuration(Math.round(calls.reduce((acc, c) => acc + (c.duration || 0), 0) / calls.length))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">With Insights</CardTitle>
                        <Sparkles className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calls.filter(c => c.insights && c.insights.length > 0).length}
                        </div>
                    </CardContent>
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
                                                        <TrendingUp className={`h-4 w-4 ${getSentimentColor(call.insights[0].overall_sentiment)}`} />
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
                                                            <Sparkles className="h-4 w-4 text-yellow-500" />
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
                                                    <Sparkles className="h-4 w-4 mr-1" />
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
