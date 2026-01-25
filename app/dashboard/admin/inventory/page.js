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
        <div className="flex flex-col h-full bg-slate-50/50 p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
                    <p className="text-slate-600 text-sm">Track properties and projects.</p>
                </div>
                <Link href="/dashboard/admin/inventory/new">
                    <Button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Search properties..."
                        className="pl-9 bg-slate-50 border-slate-200"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                </Button>
            </div>

            {/* Grid */}
            <div className="mt-6">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <PropertyGrid properties={filteredProperties} />
                )}
            </div>
        </div>
    )
}
