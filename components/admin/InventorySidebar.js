'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building, LayoutDashboard, BarChart3 } from 'lucide-react'

export default function InventorySidebar() {
    const pathname = usePathname()

    const items = [
        { label: 'Overview', href: '/dashboard/admin/inventory', icon: LayoutDashboard },
        { label: 'Properties', href: '/dashboard/admin/inventory?tab=properties', icon: Building },
        { label: 'Analytics', href: '/dashboard/admin/inventory?tab=analytics', icon: BarChart3 },
    ]

    return (
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] hidden md:block">
            <div className="p-4">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-4">
                    Inventory
                </h2>
                <nav className="space-y-1">
                    {items.map((item) => {
                        const isActive = pathname === item.href
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
