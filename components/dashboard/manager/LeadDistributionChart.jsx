'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'

export function LeadDistributionChart({ distribution = {} }) {
    // Transform distribution object to array for Recharts
    const data = Object.entries(distribution).map(([name, value]) => ({
        name,
        value: value.count,
        color: value.color
    }))

    const total = data.reduce((sum, item) => sum + item.value, 0)

    const RADIAN = Math.PI / 180
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5
        const x = cx + radius * Math.cos(-midAngle * RADIAN)
        const y = cy + radius * Math.sin(-midAngle * RADIAN)

        if (percent < 0.05) return null // Don't show label if too small

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                className="text-xs font-semibold"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Lead Distribution
                </CardTitle>
            </CardHeader>
            <CardContent>
                {data.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>No lead data available</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-center">
                            <div className="text-3xl font-bold">{total}</div>
                            <div className="text-sm text-muted-foreground">Total Leads</div>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={renderCustomizedLabel}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white p-3 rounded-lg shadow-lg border">
                                                    <p className="font-medium">{payload[0].name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {payload[0].value} leads ({((payload[0].value / total) * 100).toFixed(1)}%)
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    content={({ payload }) => (
                                        <div className="flex flex-wrap justify-center gap-3 mt-4">
                                            {payload.map((entry, index) => (
                                                <div key={`legend-${index}`} className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: entry.color }}
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {entry.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
