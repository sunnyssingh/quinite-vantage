import { useState } from 'react'
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
    Settings,
    ChevronLeft,
    ChevronRight,
    Phone,
    TrendingUp,
    Clock
} from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function CrmSidebar() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

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
            title: 'Call Management',
            items: [
                { label: 'Live Calls', href: '/dashboard/admin/crm/calls/live', icon: Phone },
                { label: 'Call History', href: '/dashboard/admin/crm/calls/history', icon: Clock },
                { label: 'Insights', href: '/dashboard/admin/crm/insights', icon: TrendingUp },
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
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "bg-background border-r border-border h-full hidden md:flex flex-col transition-all duration-300 relative",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
                    <nav className="space-y-4 px-2">
                        {navigationSections.map((section, sectionIndex) => (
                            <div key={section.title}>
                                {/* Section Header */}
                                {!isCollapsed && (
                                    <div className="px-4 mb-2 animate-in fade-in duration-300">
                                        <h3 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                                            {section.title}
                                        </h3>
                                    </div>
                                )}
                                {isCollapsed && sectionIndex > 0 && <div className="h-px bg-border my-2 mx-2" />}

                                {/* Section Items */}
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard/admin/crm') || (item.label === 'Pipeline' && pathname === '/dashboard/admin/crm')
                                        const Icon = item.icon

                                        const LinkContent = (
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                                                    isActive
                                                        ? "bg-blue-50 text-blue-700 shadow-sm"
                                                        : "text-muted-foreground hover:bg-slate-50 hover:text-foreground",
                                                    isCollapsed && "justify-center px-2 py-3"
                                                )}
                                            >
                                                <Icon className={cn(
                                                    "w-5 h-5 transition-colors",
                                                    isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                                )} />
                                                {!isCollapsed && (
                                                    <span className="animate-in fade-in slide-in-from-left-2 duration-300 whitespace-nowrap">
                                                        {item.label}
                                                    </span>
                                                )}
                                                {isActive && !isCollapsed && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-600 rounded-r-full" />
                                                )}
                                            </Link>
                                        )

                                        if (isCollapsed) {
                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>
                                                        {LinkContent}
                                                    </TooltipTrigger>
                                                    <TooltipContent side="right" className="font-medium bg-slate-900 text-white border-slate-800">
                                                        {item.label}
                                                    </TooltipContent>
                                                </Tooltip>
                                            )
                                        }

                                        return <div key={item.href}>{LinkContent}</div>
                                    })}
                                </div>
                            </div>
                        ))}
                    </nav>
                </div>

                {/* Footer Toggle */}
                <div className="p-4 border-t border-border mt-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full h-9 hover:bg-slate-100 text-slate-500 hover:text-slate-900"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </Button>
                </div>
            </aside>
        </TooltipProvider >
    )
}
