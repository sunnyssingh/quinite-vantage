'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { KanbanSquare, Megaphone, Users } from 'lucide-react'

export default function CrmNav({ projectId }) {
    const router = useRouter()
    const pathname = usePathname()

    // Only show navigation when inside a project
    if (!projectId) return null

    const navItems = [
        {
            name: 'Pipeline',
            icon: KanbanSquare,
            path: '/dashboard/admin/crm',
            active: pathname === '/dashboard/admin/crm'
        },
        {
            name: 'Campaigns',
            icon: Megaphone,
            path: '/dashboard/admin/crm/campaigns',
            active: pathname.includes('/campaigns')
        },
        {
            name: 'Leads',
            icon: Users,
            path: '/dashboard/admin/crm/leads',
            active: pathname.includes('/leads')
        }
    ]

    const handleNav = (path) => {
        // Persist project_id if it exists
        const target = projectId ? `${path}?project_id=${projectId}` : path
        router.push(target)
    }

    return (
        <div className="flex items-center gap-2 mb-6">
            <div className="flex p-1 bg-slate-100 rounded-lg border border-slate-200">
                {navItems.map((item) => (
                    <Button
                        key={item.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNav(item.path)}
                        className={`gap-2 text-sm font-medium transition-all ${item.active
                            ? 'bg-white text-purple-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                            }`}
                    >
                        <item.icon className="w-4 h-4" />
                        {item.name}
                    </Button>
                ))}
            </div>
        </div>
    )
}
