'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    KanbanSquare,
    Building,
    BarChart3,
    FileText,
    Users,
    Settings,
    LogOut,
    Megaphone,
    Lock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { usePermissions } from '@/contexts/PermissionContext'

export default function AdminSidebar() {
    const pathname = usePathname()

    // Main navigation groups
    const sections = [
        {
            title: 'Overview',
            items: [
                { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, exact: true },
            ]
        },
        {
            title: 'Modules',
            items: [
                { label: 'CRM', href: '/dashboard/admin/crm', icon: KanbanSquare, permission: ['view_own_leads', 'view_team_leads', 'view_all_leads', 'view_projects'] },
                { label: 'Inventory', href: '/dashboard/admin/inventory', icon: Building, permission: 'view_inventory' },
            ]
        },
        {
            title: 'Management',
            items: [
                { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3, permission: ['view_own_analytics', 'view_team_analytics', 'view_org_analytics'] },
                { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: FileText, permission: 'view_settings' },
                { label: 'Users', href: '/dashboard/admin/users', icon: Users, permission: 'view_users' },
            ]
        },
        {
            title: 'System',
            items: [
                { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings, permission: 'view_settings' },
            ]
        }
    ]

    const { hasPermission, hasAnyPermission, loading } = usePermissions()

    if (loading) return null // Or a skeleton

    // Filter sections based on permissions
    const filteredSections = sections.map(section => {
        const filteredItems = section.items.filter(item => {
            if (!item.permission) return true
            if (Array.isArray(item.permission)) return hasAnyPermission(item.permission)
            return hasPermission(item.permission)
        })
        return { ...section, items: filteredItems }
    }).filter(section => section.items.length > 0)

    return (
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] hidden md:block flex-shrink-0">
            <div className="py-6 px-4 space-y-8">
                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
                            {section.title}
                        </h2>
                        <nav className="space-y-1">
                            {section.items.map((item) => {
                                const itemHasPermission = item.permission
                                    ? Array.isArray(item.permission)
                                        ? hasAnyPermission(item.permission)
                                        : hasPermission(item.permission)
                                    : true

                                // Active logic: Exact match for Dashboard, prefix match for others
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)

                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={itemHasPermission ? item.href : '#'}
                                        onClick={(e) => {
                                            if (!itemHasPermission) {
                                                e.preventDefault()
                                                // You might want to add a toast notification here
                                                // e.g., toast.error(`You don't have permission to access ${item.label}`)
                                            }
                                        }}
                                        className={`
                                            flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                            ${isActive && itemHasPermission
                                                ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-sm border border-purple-100'
                                                : itemHasPermission
                                                    ? 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                    : 'text-slate-400 cursor-not-allowed opacity-60'}
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                                        <span className="flex-1">{item.label}</span>
                                        {!itemHasPermission && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>
                ))}
            </div>
        </aside>
    )
}
