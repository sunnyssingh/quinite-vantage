'use client'
import { useState, useEffect } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Users,
    FolderKanban,
    UserPlus,
    Megaphone,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Download,
    Plus,
    BarChart3,
    FileText,
    Settings,
    KanbanSquare,
    Building
} from 'lucide-react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link'

export default function AdminDashboardPage() {
    const [dashboardStats, setDashboardStats] = useState({
        users: { value: 0, trend: 0 },
        projects: { value: 0, trend: 0 },
        leads: { value: 0, trend: 0 },
        activeCampaigns: { value: 0, trend: 0 }
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/stats')
                const data = await res.json()
                if (res.ok) {
                    setDashboardStats(data)
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    const formatTrend = (val) => {
        if (val > 0) return `+${val}%`
        return `${val}%`
    }

    const getTrendDirection = (val) => {
        return val >= 0 ? 'up' : 'down'
    }

    const stats = [
        {
            title: 'Total Leads',
            value: loading ? '...' : dashboardStats.leads?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.leads?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.leads?.trend || 0),
            icon: UserPlus,
            gradient: 'from-purple-500 to-indigo-500',
            iconColor: 'text-purple-600',
            bg: 'bg-purple-50'
        },
        {
            title: 'Active Campaigns',
            value: loading ? '...' : dashboardStats.activeCampaigns?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.activeCampaigns?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.activeCampaigns?.trend || 0),
            icon: Megaphone,
            gradient: 'from-pink-500 to-rose-500',
            iconColor: 'text-pink-600',
            bg: 'bg-pink-50'
        },
        {
            title: 'Total Projects',
            value: loading ? '...' : dashboardStats.projects?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.projects?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.projects?.trend || 0),
            icon: FolderKanban,
            gradient: 'from-blue-500 to-cyan-500',
            iconColor: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Total Users',
            value: loading ? '...' : dashboardStats.users?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.users?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.users?.trend || 0),
            icon: Users,
            gradient: 'from-slate-700 to-slate-900',
            iconColor: 'text-slate-600',
            bg: 'bg-slate-50'
        }
    ]

    const quickActions = [
        {
            title: 'Manage CRM Pipeline',
            description: 'View deals and update stages',
            href: '/dashboard/admin/crm',
            icon: KanbanSquare,
            color: 'purple'
        },
        {
            title: 'Manage Inventory',
            description: 'Add properties or update listings',
            href: '/dashboard/admin/inventory',
            icon: Building,
            color: 'pink'
        },
        {
            title: 'View Analytics',
            description: 'Track overall performance',
            href: '/dashboard/admin/analytics',
            icon: BarChart3,
            color: 'blue'
        },
        {
            title: 'Organization Settings',
            description: 'Manage users and profile',
            href: '/dashboard/admin/settings',
            icon: Settings,
            color: 'slate'
        }
    ]

    const handleExport = () => {
        const headers = ['Metric,Value,Trend\n']
        const rows = [
            `Total Users,${dashboardStats.users?.value || 0},${dashboardStats.users?.trend || 0}%`,
            `Total Projects,${dashboardStats.projects?.value || 0},${dashboardStats.projects?.trend || 0}%`,
            `Total Leads,${dashboardStats.leads?.value || 0},${dashboardStats.leads?.trend || 0}%`,
            `Total Campaigns,${dashboardStats.activeCampaigns?.value || 0},${dashboardStats.activeCampaigns?.trend || 0}%`
        ]
        const csvContent = headers.concat(rows).join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.setAttribute('href', url)
        link.setAttribute('download', 'dashboard_stats.csv')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back! Here's your personalized report.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleExport} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export Report
                    </Button>
                    <Link href="/dashboard/admin/inventory/new">
                        <Button className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-200">
                            <Plus className="w-4 h-4" />
                            New Property
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
                    const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600'

                    return (
                        <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 border-slate-200">
                            <CardContent className="p-0">
                                <div className={`h-1 w-full bg-gradient-to-r ${stat.gradient}`} />
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                                            <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                                        </div>
                                        <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.trend === 'up' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                            <TrendIcon className="w-3 h-3" />
                                            {stat.change}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</h3>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Links Column */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon
                            return (
                                <Link key={index} href={action.href}>
                                    <Card className="group hover:border-purple-300 hover:shadow-md transition-all cursor-pointer h-full border-slate-200">
                                        <CardContent className="p-6 flex items-start gap-4">
                                            <div className={`p-3 rounded-lg bg-${action.color}-50 text-${action.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700 transition-colors">
                                                        {action.title}
                                                    </h3>
                                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Report Column */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-gray-900">Reports</h2>
                    <Card className="h-full border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="w-5 h-5 text-purple-600" />
                                Performance Insight
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 border-2 border-dashed border-purple-100 rounded-xl flex flex-col items-center justify-center bg-white/50 p-6 text-center">
                                <div className="p-3 bg-purple-50 rounded-full mb-3">
                                    <BarChart3 className="w-6 h-6 text-purple-400" />
                                </div>
                                <p className="text-slate-600 font-medium text-sm">Monthly Report Generated</p>
                                <p className="text-xs text-slate-400 mt-1 mb-4">Based on your recent activity</p>
                                <Button variant="outline" size="sm" className="w-full border-purple-200 text-purple-700 hover:bg-purple-50">
                                    Download PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
