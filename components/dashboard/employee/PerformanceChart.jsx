'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

export function PerformanceChart({ data = [] }) {
    // Format date for display
    const formatDate = (dateStr) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    // Calculate totals
    const totalCalls = data.reduce((sum, day) => sum + day.calls, 0)
    const totalConversions = data.reduce((sum, day) => sum + day.conversions, 0)
    const avgConversionRate = totalCalls > 0 ? ((totalConversions / totalCalls) * 100).toFixed(1) : 0

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    My Performance (Last 7 Days)
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 || totalCalls === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No performance data yet</p>
                        <p className="text-sm mt-1">Start making calls to see your progress</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{totalCalls}</div>
                                <div className="text-xs text-muted-foreground">Total Calls</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{totalConversions}</div>
                                <div className="text-xs text-muted-foreground">Conversions</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{avgConversionRate}%</div>
                                <div className="text-xs text-muted-foreground">Avg Rate</div>
                            </div>
                        </div>

                        {/* Chart */}
                        <ResponsiveContainer width="100%" height={250}>
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    stroke="#6b7280"
                                    style={{ fontSize: '12px' }}
                                />
                                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 rounded-lg shadow-lg border">
                                                    <p className="font-medium mb-2">
                                                        {formatDate(payload[0].payload.date)}
                                                    </p>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                            <span className="text-sm">
                                                                Calls: {payload[0].value}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-3 h-3 rounded-full bg-green-500" />
                                                            <span className="text-sm">
                                                                Conversions: {payload[1].value}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Legend
                                    wrapperStyle={{ fontSize: '12px' }}
                                    iconType="circle"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="calls"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ fill: '#3b82f6', r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Calls"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="conversions"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ fill: '#10b981', r: 4 }}
                                    activeDot={{ r: 6 }}
                                    name="Conversions"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
