'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Building2 } from 'lucide-react'
import { PropertyGrid } from '@/components/inventory/PropertyGrid'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function PropertiesPage() {
    const [properties, setProperties] = useState([])
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [selectedProject, setSelectedProject] = useState('all')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            setLoading(true)
            const [pRes, projRes] = await Promise.all([
                fetch('/api/inventory/properties'),
                fetch('/api/projects')
            ])

            const pData = await pRes.json()
            const projData = await projRes.json()

            setProperties(pData.properties || [])
            setProjects(projData.projects || [])
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to load properties')
        } finally {
            setLoading(false)
        }
    }

    const filteredProperties = properties.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
            p.address?.toLowerCase().includes(search.toLowerCase())
        const matchesProject = selectedProject === 'all' || p.project_id === selectedProject
        return matchesSearch && matchesProject
    })

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex flex-col gap-6 p-6 border-b border-border bg-background shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Properties</h1>
                        <p className="text-muted-foreground mt-1 text-sm">Manage your property inventory.</p>
                    </div>
                    <Link href="/dashboard/admin/inventory/new">
                        <Button className="h-9 text-xs">
                            <Plus className="w-3.5 h-3.5 mr-2" />
                            Add Property
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full sm:min-w-[300px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search properties..."
                            className="pl-9 h-9 text-sm bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger className="w-[200px] h-9 bg-background">
                            <Building2 className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Filter by Project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex bg-muted/20 rounded-xl border border-border h-64 items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/5">
                        <Building2 className="w-10 h-10 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No Properties Found</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                            {search || selectedProject !== 'all'
                                ? "Try adjusting your search or filters."
                                : "Add your first property listing to get started monitoring inventory."}
                        </p>
                    </div>
                ) : (
                    <PropertyGrid properties={filteredProperties} />
                )}
            </div>
        </div>
    )
}
