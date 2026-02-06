'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Search, Building2, Home, CheckCircle2, TrendingUp } from 'lucide-react'
import ProjectCard from '@/components/inventory/ProjectCard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function InventoryOverviewPage() {
    const [inventoryProjects, setInventoryProjects] = useState([])
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            // Fetch both projects and properties
            const [projectsRes, propertiesRes] = await Promise.all([
                fetch('/api/inventory/projects'),
                fetch('/api/inventory/properties')
            ])

            const projectsData = await projectsRes.json()
            const propertiesData = await propertiesRes.json()

            setInventoryProjects(projectsData.projects || [])
            setProperties(propertiesData.properties || [])
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

    // Calculate quick stats from ACTUAL properties, not total_units field
    const totalProjects = inventoryProjects.length
    const totalUnits = properties.length // Use actual property count
    const totalSold = properties.filter(p => p.status === 'sold').length
    const totalAvailable = properties.filter(p => p.status === 'available').length
    const totalReserved = properties.filter(p => p.status === 'reserved').length

    const quickStats = [
        {
            title: 'Total Projects',
            value: totalProjects,
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            title: 'Total Units',
            value: totalUnits,
            icon: Home,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            borderColor: 'border-purple-200'
        },
        {
            title: 'Available',
            value: totalAvailable,
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            borderColor: 'border-emerald-200'
        },
        {
            title: 'Sold',
            value: totalSold,
            icon: CheckCircle2,
            color: 'text-slate-600',
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-200'
        }
    ]

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col gap-6 p-6 border-b border-border bg-background shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Inventory Overview</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Track active inventory projects and properties.</p>
                    </div>
                    <Link href="/dashboard/admin/inventory/properties">
                        <Button variant="outline" size="sm">
                            <Building2 className="w-4 h-4 mr-2" />
                            View All Properties
                        </Button>
                    </Link>
                </div>

                {/* Quick Stats */}
                {!loading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {quickStats.map((stat, index) => (
                            <Card key={index} className={`border ${stat.borderColor} shadow-sm hover:shadow-md transition-shadow`}>
                                <CardContent className={`p-4 ${stat.bgColor}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{stat.title}</p>
                                            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                                        </div>
                                        <stat.icon className={`w-8 h-8 ${stat.color} opacity-60`} />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Search */}
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
