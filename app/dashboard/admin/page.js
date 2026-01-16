'use client'
import { useState, useEffect } from 'react'

import { Card, CardContent } from '@/components/ui/card'
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
    BarChart3
} from 'lucide-react'
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
            title: 'Total Users',
            value: loading ? '...' : dashboardStats.users?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.users?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.users?.trend || 0),
            icon: Users,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-l-blue-500'
        },
        {
            title: 'Total Projects',
            value: loading ? '...' : dashboardStats.projects?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.projects?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.projects?.trend || 0),
            icon: FolderKanban,
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            borderColor: 'border-l-indigo-500'
        },
        {
            title: 'Total Leads',
            value: loading ? '...' : dashboardStats.leads?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.leads?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.leads?.trend || 0),
            icon: UserPlus,
            color: 'green',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            borderColor: 'border-l-green-500'
        },
        {
            title: 'Total Campaigns',
            value: loading ? '...' : dashboardStats.activeCampaigns?.value || 0,
            change: loading ? '...' : `${formatTrend(dashboardStats.activeCampaigns?.trend || 0)} from last 30 days`,
            trend: getTrendDirection(dashboardStats.activeCampaigns?.trend || 0),
            icon: Megaphone,
            color: 'amber',
            bgColor: 'bg-amber-50',
            iconColor: 'text-amber-600',
            borderColor: 'border-l-amber-500'
        }
    ]

    const quickActions = [
        {
            title: 'Manage Users',
            description: 'Invite, edit, and manage team members',
            href: '/dashboard/admin/users',
            icon: Users,
            color: 'blue'
        },
        {
            title: 'Manage Projects',
            description: 'Create and manage projects',
            href: '/dashboard/admin/projects',
            icon: FolderKanban,
            color: 'indigo'
        },
        {
            title: 'Manage Leads',
            description: 'View and manage all leads',
            href: '/dashboard/admin/leads',
            icon: UserPlus,
            color: 'green'
        },
        {
            title: 'View Analytics',
            description: 'Track performance and insights',
            href: '/dashboard/admin/analytics',
            icon: BarChart3,
            color: 'purple'
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
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
                        <p className="text-gray-600 mt-1 text-sm md:text-base">Welcome back, here's what's happening with your organization</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" onClick={handleExport}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Link href="/dashboard/admin/projects">
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                New Project
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => {
                    const Icon = stat.icon
                    const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown
                    const trendColor = stat.trend === 'up' ? 'text-green-600' : 'text-red-600'

                    return (
                        <Card
                            key={index}
                            className={`border-l-4 ${stat.borderColor} hover:shadow-lg transition-shadow duration-200`}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                                            {stat.title}
                                        </p>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            {stat.value}
                                        </p>
                                        <p className={`text-xs ${trendColor} mt-2 flex items-center gap-1`}>
                                            <TrendIcon className="w-3 h-3" />
                                            <span>{stat.change} from last month</span>
                                        </p>
                                    </div>
                                    <div className={`p-3 ${stat.bgColor} rounded-full`}>
                                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardContent className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action, index) => {
                            const Icon = action.icon

                            return (
                                <Link key={index} href={action.href}>
                                    <Card className="group hover:shadow-lg hover:border-blue-500 transition-all cursor-pointer h-full">
                                        <CardContent className="p-6">
                                            <div className="flex flex-col gap-4">
                                                <div className="flex items-start justify-between">
                                                    <div className={`p-3 bg-${action.color}-50 rounded-lg group-hover:bg-${action.color}-100 transition-colors`}>
                                                        <Icon className={`w-5 h-5 text-${action.color}-600`} />
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                        {action.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {action.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
