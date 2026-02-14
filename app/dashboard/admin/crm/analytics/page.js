'use client'

import React from 'react'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'
import { PermissionGate } from '@/components/permissions/PermissionGate'

export default function CrmAnalyticsPage() {
    return (
        <PermissionGate
            feature="view_organization_analytics"
            fallbackFeatures={['view_team_analytics', 'view_own_analytics']}
            fallbackMessage="You don't have permission to view analytics. Contact your administrator."
        >
            <AnalyticsDashboard />
        </PermissionGate>
    )
}
