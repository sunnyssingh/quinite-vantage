'use client'

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
    const stats = [
        {
            title: 'Total Users',
            value: '--',
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'blue',
            bgColor: 'bg-blue-50',
            iconColor: 'text-blue-600',
            borderColor: 'border-l-blue-500'
        },
        {
            title: 'Total Projects',
            value: '--',
            change: '+8%',
            trend: 'up',
            icon: FolderKanban,
            color: 'indigo',
            bgColor: 'bg-indigo-50',
            iconColor: 'text-indigo-600',
            borderColor: 'border-l-indigo-500'
        },
        {
            title: 'Total Leads',
            value: '--',
            change: '+23%',
            trend: 'up',
            icon: UserPlus,
            color: 'green',
            bgColor: 'bg-green-50',
            iconColor: 'text-green-600',
            borderColor: 'border-l-green-500'
        },
        {
            title: 'Active Campaigns',
            value: '--',
            change: '-3%',
            trend: 'down',
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
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            New Project
                        </Button>
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
