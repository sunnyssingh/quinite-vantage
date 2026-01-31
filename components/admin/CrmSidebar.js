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

    // Grouped navigation structure
    const navigationSections = [
        {
            title: 'Overview',
            items: [
                { label: 'Dashboard', href: '/dashboard/admin/crm/dashboard', icon: LayoutDashboard },
            ]
        },
        {
            title: 'Sales Management',
            items: [
                { label: 'Pipeline', href: '/dashboard/admin/crm?tab=pipeline', icon: KanbanSquare },
                { label: 'Leads', href: '/dashboard/admin/crm/leads', icon: Users },
                { label: 'Projects', href: '/dashboard/admin/crm/projects', icon: FolderKanban },
            ]
        },
        {
            title: 'Marketing',
            items: [
                { label: 'Campaigns', href: '/dashboard/admin/crm/campaigns', icon: Megaphone },
            ]
        },
        {
            title: 'Insights & Admin',
            items: [
                { label: 'Analytics', href: '/dashboard/admin/crm/analytics', icon: BarChart3 },
                { label: 'Audit Log', href: '/dashboard/admin/crm/auditlog', icon: FileText },
                { label: 'Settings', href: '/dashboard/admin/crm/settings', icon: Settings },
            ]
        }
    ]

    return (
        <aside className="w-64 bg-background border-r border-border min-h-[calc(100vh-4rem)] hidden md:block animate-in sm:slide-in-from-left duration-300">
            <div className="p-4">
                <nav className="space-y-3">
                    {navigationSections.map((section, sectionIndex) => (
                        <div key={section.title}>
                            {/* Section Header */}
                            <div className="px-4 mb-1.5">
                                <h3 className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
                                    {section.title}
                                </h3>
                            </div>

                            {/* Section Items */}
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || (item.label === 'Pipeline' && pathname === '/dashboard/admin/crm')
                                    const Icon = item.icon

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`
                                                flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md transition-colors
                                                ${isActive
                                                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                                            `}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-foreground' : 'text-muted-foreground'}`} />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </div>

                            {/* Separator between sections (except last) */}
                            {sectionIndex < navigationSections.length - 1 && (
                                <div className="mt-2 mx-4 border-t border-border/50"></div>
                            )}
                        </div>
                    ))}
                </nav>
            </div>
        </aside>
    )
}
