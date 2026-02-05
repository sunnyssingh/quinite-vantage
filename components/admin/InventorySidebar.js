import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building, LayoutDashboard, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

export default function InventorySidebar() {
    const pathname = usePathname()
    const [isCollapsed, setIsCollapsed] = useState(false)

    const items = [
        { label: 'Overview', href: '/dashboard/admin/inventory', icon: LayoutDashboard },
        { label: 'Properties', href: '/dashboard/admin/inventory/properties', icon: Building },
        { label: 'Analytics', href: '/dashboard/admin/inventory/analytics', icon: BarChart3 },
    ]

    return (
        <TooltipProvider delayDuration={0}>
            <aside
                className={cn(
                    "bg-white border-r border-gray-200 h-full hidden md:flex flex-col transition-all duration-300 relative",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                <div className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
                    {!isCollapsed && (
                        <h2 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-6 animate-in fade-in duration-300">
                            Inventory
                        </h2>
                    )}
                    {isCollapsed && <div className="h-px bg-gray-100 my-4 mx-4" />}

                    <nav className="space-y-1 px-2">
                        {items.map((item) => {
                            const isActive = pathname === item.href
                            const Icon = item.icon

                            const LinkContent = (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group relative overflow-hidden",
                                        isActive
                                            ? "bg-blue-50 text-blue-700 shadow-sm"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                                        isCollapsed && "justify-center px-2 py-3"
                                    )}
                                >
                                    <Icon className={cn(
                                        "w-5 h-5 transition-colors",
                                        isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
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
                    </nav>
                </div>

                {/* Footer Toggle */}
                <div className="p-4 border-t border-gray-100 mt-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className="w-full h-9 hover:bg-gray-50 text-gray-400 hover:text-gray-900"
                    >
                        {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                            <div className="flex items-center gap-2">
                                <ChevronLeft className="w-5 h-5" />
                                <span className="text-xs font-medium uppercase tracking-wide">Collapse</span>
                            </div>
                        )}
                    </Button>
                </div>
            </aside>
        </TooltipProvider>
    )
}
