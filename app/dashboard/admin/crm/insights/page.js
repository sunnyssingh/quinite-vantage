'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
import { TrendingUp, MessageSquare, DollarSign, Calendar, AlertTriangle } from 'lucide-react'

export default function ConversationInsightsDashboard({ campaignId = null, dateRange = 30 }) {
    const [insights, setInsights] = useState([])
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalInsights: 0,
        avgSentiment: 0,
        highInterest: 0,
        budgetMentioned: 0
    })
    const supabase = createClient()

    useEffect(() => {
        fetchInsights()
    }, [campaignId, dateRange])

    const fetchInsights = async () => {
        let query = supabase
            .from('conversation_insights')
            .select('*')
            .gte('created_at', new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000).toISOString())
            .order('created_at', { ascending: false })

        if (campaignId) {
            query = query.eq('campaign_id', campaignId)
        }

        const { data, error } = await query

        if (!error && data) {
            setInsights(data)
            calculateStats(data)
        }
        setLoading(false)
    }

    const calculateStats = (data) => {
        const totalInsights = data.length
        const avgSentiment = data.reduce((sum, i) => sum + (i.sentiment_score || 0), 0) / totalInsights
        const highInterest = data.filter(i => i.interest_level === 'high').length
        const budgetMentioned = data.filter(i => i.budget_mentioned).length

        setStats({
            totalInsights,
            avgSentiment: avgSentiment.toFixed(2),
            highInterest,
            budgetMentioned
        })
    }

    // Sentiment Distribution
    const getSentimentData = () => {
        const positive = insights.filter(i => i.sentiment_score > 0.3).length
        const neutral = insights.filter(i => i.sentiment_score >= -0.3 && i.sentiment_score <= 0.3).length
        const negative = insights.filter(i => i.sentiment_score < -0.3).length

        return [
            { name: 'Positive', value: positive, color: '#10b981' },
            { name: 'Neutral', value: neutral, color: '#f59e0b' },
            { name: 'Negative', value: negative, color: '#ef4444' }
        ]
    }

    // Interest Level Distribution
    const getInterestData = () => {
        const high = insights.filter(i => i.interest_level === 'high').length
        const medium = insights.filter(i => i.interest_level === 'medium').length
        const low = insights.filter(i => i.interest_level === 'low').length

        return [
            { name: 'High', value: high },
            { name: 'Medium', value: medium },
            { name: 'Low', value: low }
        ]
    }

    // Purchase Readiness
    const getPurchaseReadinessData = () => {
        const immediate = insights.filter(i => i.purchase_readiness === 'immediate').length
        const shortTerm = insights.filter(i => i.purchase_readiness === 'short_term').length
        const longTerm = insights.filter(i => i.purchase_readiness === 'long_term').length
        const notReady = insights.filter(i => i.purchase_readiness === 'not_ready').length

        return [
            { name: 'Immediate', value: immediate },
            { name: 'Short Term', value: shortTerm },
            { name: 'Long Term', value: longTerm },
            { name: 'Not Ready', value: notReady }
        ]
    }

    // Common Objections
    const getCommonObjections = () => {
        const objectionCounts = {}
        insights.forEach(insight => {
            if (insight.objections && Array.isArray(insight.objections)) {
                insight.objections.forEach(obj => {
                    objectionCounts[obj] = (objectionCounts[obj] || 0) + 1
                })
            }
        })

        return Object.entries(objectionCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }))
    }

    // Budget Ranges
    const getBudgetRanges = () => {
        const ranges = {
            'Under 50L': 0,
            '50L-1Cr': 0,
            '1Cr-2Cr': 0,
            '2Cr+': 0,
            'Not Mentioned': 0
        }

        insights.forEach(insight => {
            if (!insight.budget_mentioned || !insight.budget_range) {
                ranges['Not Mentioned']++
            } else {
                const range = insight.budget_range
                if (range < 5000000) ranges['Under 50L']++
                else if (range < 10000000) ranges['50L-1Cr']++
                else if (range < 20000000) ranges['1Cr-2Cr']++
                else ranges['2Cr+']++
            }
        })

        return Object.entries(ranges).map(([name, value]) => ({ name, value }))
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Conversation Insights</h1>
                <p className="text-gray-500 mt-1">AI-powered analysis of customer conversations</p>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
                        <MessageSquare className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalInsights}</div>
                        <p className="text-xs text-muted-foreground">Last {dateRange} days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Sentiment</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.avgSentiment}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.avgSentiment > 0 ? 'Positive' : stats.avgSentiment < 0 ? 'Negative' : 'Neutral'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Interest</CardTitle>
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.highInterest}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalInsights > 0 ? Math.round((stats.highInterest / stats.totalInsights) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Mentioned</CardTitle>
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.budgetMentioned}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalInsights > 0 ? Math.round((stats.budgetMentioned / stats.totalInsights) * 100) : 0}% of total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="sentiment" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
                    <TabsTrigger value="interest">Interest Level</TabsTrigger>
                    <TabsTrigger value="readiness">Purchase Readiness</TabsTrigger>
                    <TabsTrigger value="objections">Objections</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                </TabsList>

                {/* Sentiment Distribution */}
                <TabsContent value="sentiment">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sentiment Distribution</CardTitle>
                            <CardDescription>Overall customer sentiment across conversations</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={getSentimentData().filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {getSentimentData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Interest Level */}
                <TabsContent value="interest">
                    <Card>
                        <CardHeader>
                            <CardTitle>Interest Level Breakdown</CardTitle>
                            <CardDescription>Customer interest in the product/service</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getInterestData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#3b82f6" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Purchase Readiness */}
                <TabsContent value="readiness">
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Readiness Timeline</CardTitle>
                            <CardDescription>When customers are ready to make a decision</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getPurchaseReadinessData()}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#10b981" name="Count" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Common Objections */}
                <TabsContent value="objections">
                    <Card>
                        <CardHeader>
                            <CardTitle>Common Objections</CardTitle>
                            <CardDescription>Most frequently raised concerns</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={getCommonObjections()} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#ef4444" name="Occurrences" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Budget Ranges */}
                <TabsContent value="budget">
                    <Card>
                        <CardHeader>
                            <CardTitle>Budget Range Distribution</CardTitle>
                            <CardDescription>Customer budget preferences</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={getBudgetRanges().filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {getBudgetRanges().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
