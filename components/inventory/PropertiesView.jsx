'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, X, Filter, ChevronDown } from 'lucide-react'
import { PropertyCard } from './PropertyCard'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

export function PropertiesView({ projectId = null }) {
    const [properties, setProperties] = useState([])
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    // Filter states
    const [selectedConfigurations, setSelectedConfigurations] = useState([])
    const [selectedTypes, setSelectedTypes] = useState([])
    const [selectedStatuses, setSelectedStatuses] = useState([])
    const [selectedProjects, setSelectedProjects] = useState(projectId ? [projectId] : [])

    const configurations = ['1BHK', '2BHK', '3BHK', '4BHK', '5BHK', '6BHK+']
    const propertyTypes = [
        { value: 'apartment', label: 'Apartment' },
        { value: 'villa', label: 'Villa' },
        { value: 'plot', label: 'Plot' },
        { value: 'commercial', label: 'Commercial' },
        { value: 'penthouse', label: 'Penthouse' },
        { value: 'studio', label: 'Studio' }
    ]
    const statuses = [
        { value: 'available', label: 'Available', color: 'bg-emerald-500' },
        { value: 'sold', label: 'Sold', color: 'bg-slate-500' },
        { value: 'reserved', label: 'Reserved', color: 'bg-amber-500' }
    ]

    useEffect(() => {
        fetchData()
    }, [projectId])

    const fetchData = async () => {
        try {
            setLoading(true)

            // Fetch properties
            const propsRes = await fetch('/api/inventory/properties')
            const propsData = await propsRes.json()
            setProperties(propsData.properties || [])

            // Fetch projects for filter
            if (!projectId) {
                const projRes = await fetch('/api/inventory/projects')
                const projData = await projRes.json()
                setProjects(projData.projects || [])
            }
        } catch (error) {
            console.error('Fetch error:', error)
            toast.error('Failed to load properties')
        } finally {
            setLoading(false)
        }
    }

    // Filter logic
    const filteredProperties = properties.filter(property => {
        // Search filter
        const matchesSearch = !search ||
            property.title?.toLowerCase().includes(search.toLowerCase()) ||
            property.address?.toLowerCase().includes(search.toLowerCase())

        // Configuration filter
        const matchesConfig = selectedConfigurations.length === 0 ||
            selectedConfigurations.includes(property.configuration)

        // Type filter
        const matchesType = selectedTypes.length === 0 ||
            selectedTypes.includes(property.type)

        // Status filter
        const matchesStatus = selectedStatuses.length === 0 ||
            selectedStatuses.includes(property.status)

        // Project filter
        const matchesProject = selectedProjects.length === 0 ||
            selectedProjects.includes(property.project_id)

        return matchesSearch && matchesConfig && matchesType && matchesStatus && matchesProject
    })

    const toggleFilter = (filterArray, setFilterArray, value) => {
        if (filterArray.includes(value)) {
            setFilterArray(filterArray.filter(v => v !== value))
        } else {
            setFilterArray([...filterArray, value])
        }
    }

    const clearAllFilters = () => {
        setSelectedConfigurations([])
        setSelectedTypes([])
        setSelectedStatuses([])
        if (!projectId) setSelectedProjects([])
        setSearch('')
    }

    const hasActiveFilters = selectedConfigurations.length > 0 ||
        selectedTypes.length > 0 ||
        selectedStatuses.length > 0 ||
        selectedProjects.length > 0 ||
        search

    return (
        <div className="flex flex-col h-full">
            {/* Filters Bar */}
            <div className="flex flex-col gap-4 p-6 border-b border-border bg-background shrink-0">
                {/* Search */}
                <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search properties..."
                        className="pl-10 h-10 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Configuration Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="w-3.5 h-3.5 mr-2" />
                                Configuration
                                {selectedConfigurations.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                                        {selectedConfigurations.length}
                                    </Badge>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Select Configuration</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {configurations.map(config => (
                                <DropdownMenuCheckboxItem
                                    key={config}
                                    checked={selectedConfigurations.includes(config)}
                                    onCheckedChange={() => toggleFilter(selectedConfigurations, setSelectedConfigurations, config)}
                                >
                                    {config}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Type Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="w-3.5 h-3.5 mr-2" />
                                Property Type
                                {selectedTypes.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                                        {selectedTypes.length}
                                    </Badge>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Select Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {propertyTypes.map(type => (
                                <DropdownMenuCheckboxItem
                                    key={type.value}
                                    checked={selectedTypes.includes(type.value)}
                                    onCheckedChange={() => toggleFilter(selectedTypes, setSelectedTypes, type.value)}
                                >
                                    {type.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9">
                                <Filter className="w-3.5 h-3.5 mr-2" />
                                Status
                                {selectedStatuses.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                                        {selectedStatuses.length}
                                    </Badge>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 ml-2" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Select Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statuses.map(status => (
                                <DropdownMenuCheckboxItem
                                    key={status.value}
                                    checked={selectedStatuses.includes(status.value)}
                                    onCheckedChange={() => toggleFilter(selectedStatuses, setSelectedStatuses, status.value)}
                                >
                                    <div className={`w-2 h-2 rounded-full ${status.color} mr-2`} />
                                    {status.label}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Project Filter (only if not viewing single project) */}
                    {!projectId && projects.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9">
                                    <Filter className="w-3.5 h-3.5 mr-2" />
                                    Project
                                    {selectedProjects.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs">
                                            {selectedProjects.length}
                                        </Badge>
                                    )}
                                    <ChevronDown className="w-3.5 h-3.5 ml-2" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-56">
                                <DropdownMenuLabel>Select Project</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {projects.map(project => (
                                    <DropdownMenuCheckboxItem
                                        key={project.id}
                                        checked={selectedProjects.includes(project.id)}
                                        onCheckedChange={() => toggleFilter(selectedProjects, setSelectedProjects, project.id)}
                                    >
                                        <div className="flex flex-col">
                                            <span>{project.name}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {project.total_units} units
                                            </span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-muted-foreground hover:text-foreground"
                            onClick={clearAllFilters}
                        >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Active Filter Badges */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                        {selectedConfigurations.map(config => (
                            <Badge key={config} variant="secondary" className="h-6 px-2">
                                {config}
                                <X
                                    className="w-3 h-3 ml-1.5 cursor-pointer hover:text-destructive"
                                    onClick={() => toggleFilter(selectedConfigurations, setSelectedConfigurations, config)}
                                />
                            </Badge>
                        ))}
                        {selectedTypes.map(type => (
                            <Badge key={type} variant="secondary" className="h-6 px-2 capitalize">
                                {type}
                                <X
                                    className="w-3 h-3 ml-1.5 cursor-pointer hover:text-destructive"
                                    onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)}
                                />
                            </Badge>
                        ))}
                        {selectedStatuses.map(status => (
                            <Badge key={status} variant="secondary" className="h-6 px-2 capitalize">
                                {status}
                                <X
                                    className="w-3 h-3 ml-1.5 cursor-pointer hover:text-destructive"
                                    onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)}
                                />
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Results Count */}
                <div className="text-sm text-muted-foreground">
                    Showing {filteredProperties.length} of {properties.length} properties
                </div>
            </div>

            {/* Properties Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex bg-muted/20 rounded-xl border border-border h-64 items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : filteredProperties.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-muted/5">
                        <Filter className="w-10 h-10 text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-medium">No Properties Found</h3>
                        <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                            {hasActiveFilters ? 'Try adjusting your filters' : 'No properties available'}
                        </p>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4"
                                onClick={clearAllFilters}
                            >
                                Clear All Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProperties.map(property => (
                            <PropertyCard key={property.id} property={property} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
