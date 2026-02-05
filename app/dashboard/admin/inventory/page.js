'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2 } from 'lucide-react'
import ProjectCard from '@/components/inventory/ProjectCard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function InventoryOverviewPage() {
    const [inventoryProjects, setInventoryProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/inventory/projects')
            const data = await res.json()
            setInventoryProjects(data.projects || [])
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to load projects')
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = inventoryProjects.filter(p =>
        p.name?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6 p-6 border-b border-border bg-background shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Inventory Overview</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Track active inventory projects.</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-9 h-9 text-sm bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex bg-muted/20 rounded-xl border border-border h-64 items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/5">
                        <Building2 className="w-10 h-10 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No Projects Found</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                            {search ? 'Try adjusting your search' : 'Create projects in CRM and enable "Show in Inventory"'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProjects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
