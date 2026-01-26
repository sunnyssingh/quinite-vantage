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
            <div className="flex p-1 bg-muted/50 rounded-lg border border-border">
                {navItems.map((item) => (
                    <Button
                        key={item.name}
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNav(item.path)}
                        className={`gap-2 text-xs font-medium transition-all h-8 ${item.active
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                            }`}
                    >
                        <item.icon className="w-3.5 h-3.5" />
                        {item.name}
                    </Button>
                ))}
            </div>
        </div>
    )
}
