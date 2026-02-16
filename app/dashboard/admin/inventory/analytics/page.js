'use client'

import { useState, useEffect } from 'react'
import { AnalyticsView } from '@/components/inventory/AnalyticsView'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'

import { PermissionGate } from '@/components/permissions/PermissionGate'

export default function AnalyticsPage() {
    const [properties, setProperties] = useState([])
    const [inventoryProjects, setInventoryProjects] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [pRes, invProjRes] = await Promise.all([
                fetch('/api/inventory/properties'),
                fetch('/api/inventory/projects')
            ])

            const pData = await pRes.json()
            const invProjData = await invProjRes.json()

            setProperties(pData.properties || [])
            setInventoryProjects(invProjData.projects || [])
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to load analytics data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col h-full p-6 animate-in fade-in duration-500">
                <div className="flex flex-col gap-6 border-b border-border bg-background shrink-0 pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Inventory insights and performance.</p>
                    </div>
                </div>
                <div className="flex bg-muted/20 rounded-xl border border-border h-64 items-center justify-center">
                    <LoadingSpinner />
                </div>
            </div>
        )
    }

    return (
        <PermissionGate
            feature="view_inventory"
            fallbackMessage="You do not have permission to view inventory analytics."
        >
            <div className="flex flex-col h-full animate-in fade-in duration-500">
                <div className="flex flex-col gap-6 p-6 pb-0 border-b border-border bg-background shrink-0">
                    <div className="pb-6">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Analytics</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Inventory insights and performance.</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <AnalyticsView properties={properties} projects={inventoryProjects} />
                </div>
            </div>
        </PermissionGate>
    )
}
