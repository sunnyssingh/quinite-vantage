'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
    ResponsiveContainer,
    RadialBarChart,
    RadialBar
} from 'recharts'
import { Activity, MessageSquare, Banknote, Calendar, AlertTriangle, UserCheck, TrendingUp, Brain, Sparkles } from 'lucide-react'

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
        const avgSentiment = data.reduce((sum, i) => sum + (i.overall_sentiment || 0), 0) / totalInsights
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
        const positive = insights.filter(i => i.overall_sentiment > 0.3).length
        const neutral = insights.filter(i => i.overall_sentiment >= -0.3 && i.overall_sentiment <= 0.3).length
        const negative = insights.filter(i => i.overall_sentiment < -0.3).length

        return [
            { name: 'Positive', value: positive, color: '#10b981', fill: '#10b981' },
            { name: 'Neutral', value: neutral, color: '#f59e0b', fill: '#f59e0b' },
            { name: 'Negative', value: negative, color: '#ef4444', fill: '#ef4444' }
        ]
    }

    // Interest Level Distribution
    const getInterestData = () => {
        const high = insights.filter(i => i.interest_level === 'high').length
        const medium = insights.filter(i => i.interest_level === 'medium').length
        const low = insights.filter(i => i.interest_level === 'low').length

        return [
            { name: 'High', value: high, fill: '#10b981' },
            { name: 'Medium', value: medium, fill: '#f59e0b' },
            { name: 'Low', value: low, fill: '#ef4444' }
        ]
    }

    // Purchase Readiness
    const getPurchaseReadinessData = () => {
        const immediate = insights.filter(i => i.purchase_readiness === 'immediate').length
        const shortTerm = insights.filter(i => i.purchase_readiness === 'short_term').length
        const longTerm = insights.filter(i => i.purchase_readiness === 'long_term').length
        const notReady = insights.filter(i => i.purchase_readiness === 'not_ready').length

        return [
            { name: 'Immediate', value: immediate, fill: '#10b981' },
            { name: 'Short Term', value: shortTerm, fill: '#3b82f6' },
            { name: 'Long Term', value: longTerm, fill: '#f59e0b' },
            { name: 'Not Ready', value: notReady, fill: '#ef4444' }
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
            .map(([name, count]) => ({ name, count, fill: '#ef4444' }))
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

        return Object.entries(ranges).map(([name, value], index) => ({
            name,
            value,
            fill: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6b7280'][index]
        }))
    }

    if (loading) {
        return <InsightsSkeleton />
    }

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                    <p className="font-semibold text-gray-900">{payload[0].name}</p>
                    <p className="text-sm text-gray-600">Count: <span className="font-bold">{payload[0].value}</span></p>
                </div>
            )
        }
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                            <Brain className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                                Conversation Insights
                            </h1>
                            <p className="text-xs sm:text-base text-gray-500 mt-1 flex items-center gap-2">
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                                AI-powered analysis of customer conversations
                            </p>
                        </div>
                    </div>
                </div>
                <Badge variant="outline" className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border-purple-200 text-purple-700 bg-purple-50 w-fit">
                    Last {dateRange} days
                </Badge>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Total Conversations */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <MessageSquare className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <TrendingUp className="h-5 w-5 text-white/60" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-blue-100 text-xs md:text-sm font-medium">Total Conversations</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats.totalInsights}</p>
                            <p className="text-blue-100 text-xs">Analyzed interactions</p>
                        </div>
                    </div>
                </Card>

                {/* Avg Sentiment */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Activity className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                                {stats.avgSentiment > 0 ? 'Positive' : stats.avgSentiment < 0 ? 'Negative' : 'Neutral'}
                            </div>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-green-100 text-xs md:text-sm font-medium">Avg Sentiment</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats.avgSentiment}</p>
                            <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                                <div
                                    className="bg-white h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(Math.abs(stats.avgSentiment) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </Card>

                {/* High Interest */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <UserCheck className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-xs">
                                {stats.totalInsights > 0 ? Math.round((stats.highInterest / stats.totalInsights) * 100) : 0}%
                            </Badge>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-purple-100 text-xs md:text-sm font-medium">High Interest</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats.highInterest}</p>
                            <p className="text-purple-100 text-xs">Qualified leads</p>
                        </div>
                    </div>
                </Card>

                {/* Budget Mentioned */}
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden h-full">
                    <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 md:p-6 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2.5 md:p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                                <Banknote className="h-5 w-5 md:h-6 md:w-6 text-white" />
                            </div>
                            <Badge className="bg-white/20 text-white border-0 text-xs">
                                {stats.totalInsights > 0 ? Math.round((stats.budgetMentioned / stats.totalInsights) * 100) : 0}%
                            </Badge>
                        </div>
                        <div className="space-y-1 flex-1">
                            <p className="text-amber-100 text-xs md:text-sm font-medium">Budget Mentioned</p>
                            <p className="text-3xl md:text-4xl font-bold text-white">{stats.budgetMentioned}</p>
                            <p className="text-amber-100 text-xs">Ready to invest</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="sentiment" className="space-y-6">
                <TabsList className="bg-white shadow-md border-0 p-1 w-full flex flex-wrap h-auto">
                    <TabsTrigger value="sentiment" className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white">
                        Sentiment
                    </TabsTrigger>
                    <TabsTrigger value="interest" className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                        Interest Level
                    </TabsTrigger>
                    <TabsTrigger value="readiness" className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white">
                        Purchase Readiness
                    </TabsTrigger>
                    <TabsTrigger value="objections" className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-red-600 data-[state=active]:text-white">
                        Objections
                    </TabsTrigger>
                    <TabsTrigger value="budget" className="flex-1 min-w-[120px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500 data-[state=active]:to-amber-600 data-[state=active]:text-white">
                        Budget
                    </TabsTrigger>
                </TabsList>

                {/* Sentiment Distribution */}
                <TabsContent value="sentiment" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-lg">
                            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Sentiment Distribution
                                </CardTitle>
                                <CardDescription>Overall customer sentiment across conversations</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={getSentimentData().filter(i => i.value > 0)}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={120}
                                            innerRadius={60}
                                            fill="#8884d8"
                                            dataKey="value"
                                            paddingAngle={5}
                                        >
                                            {getSentimentData().map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-lg">
                            <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle>Sentiment Breakdown</CardTitle>
                                <CardDescription>Detailed sentiment analysis</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-6">
                                    {getSentimentData().map((item, index) => (
                                        <div key={index} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                                    <span className="font-medium text-gray-700">{item.name}</span>
                                                </div>
                                                <span className="text-2xl font-bold text-gray-900">{item.value}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-3">
                                                <div
                                                    className="h-3 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${stats.totalInsights > 0 ? (item.value / stats.totalInsights) * 100 : 0}%`,
                                                        backgroundColor: item.color
                                                    }}
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                {stats.totalInsights > 0 ? ((item.value / stats.totalInsights) * 100).toFixed(1) : 0}% of total
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Interest Level */}
                <TabsContent value="interest">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                            <CardTitle className="flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-purple-600" />
                                Interest Level Breakdown
                            </CardTitle>
                            <CardDescription>Customer interest in the product/service</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={getInterestData()}>
                                    <defs>
                                        <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.3} />
                                        </linearGradient>
                                        <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3} />
                                        </linearGradient>
                                        <linearGradient id="colorLow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                                        {getInterestData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Purchase Readiness */}
                <TabsContent value="readiness">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-green-600" />
                                Purchase Readiness Timeline
                            </CardTitle>
                            <CardDescription>When customers are ready to make a decision</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={getPurchaseReadinessData()}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="name" stroke="#6b7280" />
                                    <YAxis stroke="#6b7280" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="value" radius={[8, 8, 0, 0]} name="Count">
                                        {getPurchaseReadinessData().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Common Objections */}
                <TabsContent value="objections">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                                Common Objections
                            </CardTitle>
                            <CardDescription>Most frequently raised concerns</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={getCommonObjections()} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis type="number" stroke="#6b7280" />
                                    <YAxis dataKey="name" type="category" width={180} stroke="#6b7280" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="count" radius={[0, 8, 8, 0]} name="Occurrences">
                                        {getCommonObjections().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Budget Ranges */}
                <TabsContent value="budget">
                    <Card className="border-0 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-amber-50 to-yellow-50">
                            <CardTitle className="flex items-center gap-2">
                                <Banknote className="w-5 h-5 text-amber-600" />
                                Budget Range Distribution
                            </CardTitle>
                            <CardDescription>Customer budget preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={getBudgetRanges().filter(i => i.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={130}
                                        innerRadius={70}
                                        fill="#8884d8"
                                        dataKey="value"
                                        paddingAngle={3}
                                    >
                                        {getBudgetRanges().map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function InsightsSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6 space-y-6">
            <div className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-10 w-80" />
                    <Skeleton className="h-4 w-96" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="border-0 shadow-lg">
                        <CardContent className="p-6">
                            <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                            <Skeleton className="h-4 w-32 mb-2" />
                            <Skeleton className="h-10 w-20 mb-2" />
                            <Skeleton className="h-3 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="space-y-4">
                <Skeleton className="h-12 w-full max-w-2xl rounded-lg" />
                <Card className="border-0 shadow-lg">
                    <CardHeader className="border-b">
                        <Skeleton className="h-6 w-48 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Skeleton className="h-[400px] w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

