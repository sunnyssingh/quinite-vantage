'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Fragment, useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function CustomBreadcrumbs() {
    const pathname = usePathname()
    const supabase = createClient()
    const [breadcrumbs, setBreadcrumbs] = useState([])

    useEffect(() => {
        const resolveBreadcrumbs = async () => {
            // Split pathname but keep empty strings for index alignment if needed, 
            // but usually we just want non-empty.
            const rawSegments = pathname.split('/').filter(Boolean)

            // Build items with proper hrefs first
            const items = await Promise.all(rawSegments.map(async (segment, index) => {
                const href = `/${rawSegments.slice(0, index + 1).join('/')}`

                // Default Label
                let label = segment.charAt(0).toUpperCase() + segment.slice(1)

                // Skip "Dashboard" and "Admin" in visual output (marked as hidden)
                const isHidden = ['dashboard', 'admin'].includes(segment.toLowerCase())

                // Check if segment is a UUID (simple regex)
                const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)

                if (isUUID) {
                    // Identify context based on previous segment
                    const parentSegment = rawSegments[index - 1]

                    try {
                        if (parentSegment === 'leads') {
                            const { data } = await supabase.from('leads').select('first_name, last_name, company').eq('id', segment).single()
                            if (data) label = data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : (data.company || 'Unknown Lead')
                        } else if (parentSegment === 'projects') {
                            const { data } = await supabase.from('projects').select('name').eq('id', segment).single()
                            if (data) label = data.name
                        } else if (parentSegment === 'campaigns') {
                            const { data } = await supabase.from('campaigns').select('name').eq('id', segment).single()
                            if (data) label = data.name
                        }
                    } catch (e) {
                        console.error('Error fetching breadcrumb label:', e)
                        label = 'Details'
                    }
                } else {
                    const staticLabels = {
                        'crm': 'CRM',
                        'leads': 'Leads',
                        'users': 'User Management',
                        'inventory': 'Inventory',
                        'analytics': 'Analytics',
                        'audit': 'Audit Logs',
                        'profile': 'Profile',
                        'projects': 'Projects',
                        'tasks': 'Tasks',
                        'organization': 'Organization',
                        'settings': 'Settings',
                        'crm': 'CRM',
                        'pipeline': 'Pipeline Settings'
                    }
                    if (staticLabels[segment.toLowerCase()]) {
                        label = staticLabels[segment.toLowerCase()]
                    }
                }

                return { href, label, isHidden }
            }))

            setBreadcrumbs(items.filter(item => !item.isHidden))
        }

        resolveBreadcrumbs()
    }, [pathname])

    if (breadcrumbs.length === 0) return null

    return (
        <Breadcrumb className="mb-6">
            <BreadcrumbList className="sm:gap-2">
                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1
                    return (
                        <Fragment key={item.href}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-semibold text-foreground">
                                        {item.label}
                                    </BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link
                                            href={item.href}
                                            className="text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && (
                                <BreadcrumbSeparator className="text-muted-foreground/40">
                                    <span className="">/</span>
                                </BreadcrumbSeparator>
                            )}
                        </Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}
