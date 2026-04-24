'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuditLogs from '@/components/crm/AuditLogs'
import { usePermissions } from '@/contexts/PermissionContext'

export default function AuditPage() {
    const router = useRouter()
    const { hasPermission, loading } = usePermissions()

    useEffect(() => {
        if (!loading && !hasPermission('view_audit_logs')) {
            router.replace('/dashboard/admin')
        }
    }, [loading, hasPermission])

    if (loading) return null

    return (
        <div className="p-8">
            <AuditLogs />
        </div>
    )
}
