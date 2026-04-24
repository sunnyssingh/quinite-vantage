'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import { usePermissions } from '@/contexts/PermissionContext'

export default function AnalyticsPage() {
    const router = useRouter()
    const { hasAnyPermission, loading } = usePermissions()

    useEffect(() => {
        if (!loading && !hasAnyPermission(['view_own_analytics', 'view_team_analytics', 'view_org_analytics'])) {
            router.replace('/dashboard/admin')
        }
    }, [loading, hasAnyPermission])

    if (loading) return null

    return (
        <div className="p-8">
            <AnalyticsDashboard />
        </div>
    )
}
