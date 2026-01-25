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
    Megaphone
} from 'lucide-react'

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
                { label: 'CRM', href: '/dashboard/admin/crm', icon: KanbanSquare },
                { label: 'Inventory', href: '/dashboard/admin/inventory', icon: Building },
            ]
        },
        {
            title: 'Management',
            items: [
                { label: 'Analytics', href: '/dashboard/admin/analytics', icon: BarChart3 },
                { label: 'Audit Logs', href: '/dashboard/admin/audit', icon: FileText },
                { label: 'Users', href: '/dashboard/admin/users', icon: Users },
            ]
        },
        {
            title: 'System',
            items: [
                { label: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
            ]
        }
    ]

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
                                // Active logic: Exact match for Dashboard, prefix match for others
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)

                                const Icon = item.icon

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`
                                            flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                                            ${isActive
                                                ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 shadow-sm border border-purple-100'
                                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                        `}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                                        {item.label}
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
