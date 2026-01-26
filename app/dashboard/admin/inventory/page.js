'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, Building, FolderKanban } from 'lucide-react'
import { PropertyGrid } from '@/components/inventory/PropertyGrid'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function InventoryPage() {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchProperties()
    }, [])

    const fetchProperties = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/inventory/properties')
            const data = await res.json()
            setProperties(data.properties || [])
        } catch (error) {
            toast.error('Failed to load properties')
        } finally {
            setLoading(false)
        }
    }

    const filteredProperties = properties.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.address?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6 p-6 border-b border-border bg-background shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Inventory</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Track properties and projects.</p>
                    </div>
                    <Link href="/dashboard/admin/inventory/new">
                        <Button className="h-9 text-xs">
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            Add Property
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 bg-card p-1 rounded-lg border border-border w-fit">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search properties..."
                            className="pl-9 h-9 text-sm bg-transparent border-none shadow-none focus-visible:ring-0"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex bg-muted/20 rounded-xl border border-border h-64 items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <PropertyGrid properties={filteredProperties} />
                )}
            </div>
        </div>
    )
}
