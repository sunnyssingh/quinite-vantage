'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    KanbanSquare,
    Users,
    Megaphone,
    LayoutDashboard,
    FolderKanban,
    BarChart3,
    FileText,
    Settings
} from 'lucide-react'

export default function CrmSidebar() {
    const pathname = usePathname()

    const items = [
        { label: 'Projects', href: '/dashboard/admin/crm/projects', icon: FolderKanban },
        { label: 'Campaigns', href: '/dashboard/admin/crm/campaigns', icon: Megaphone },
        { label: 'Leads', href: '/dashboard/admin/crm/leads', icon: Users },
        { label: 'Pipeline', href: '/dashboard/admin/crm?tab=pipeline', icon: KanbanSquare },
        { label: 'Analytics', href: '/dashboard/admin/crm/analytics', icon: BarChart3 },
        { label: 'Audit Log', href: '/dashboard/admin/crm/auditlog', icon: FileText },
        { label: 'Settings', href: '/dashboard/admin/crm/settings', icon: Settings },
    ]

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden md:block">
            <div className="p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4">
                    CRM Module
                </h2>
                <nav className="space-y-1">
                    {items.map((item) => {
                        const isActive = pathname === item.href || (item.label === 'Pipeline' && pathname === '/dashboard/admin/crm')
                        const Icon = item.icon

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                  flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}
                `}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700' : 'text-gray-400'}`} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>
            </div>
        </aside>
    )
}
