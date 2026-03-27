'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Search, X, Filter, ChevronDown, Plus,
    IndianRupee, Maximize, Building2, BedDouble, Info, Home
} from 'lucide-react'
import { UnitCard } from './UnitCard'
import EditUnitModal from './EditUnitModal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { toast } from 'react-hot-toast'
import { Label } from '@/components/ui/label'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { usePermission } from '@/contexts/PermissionContext'

import { useInventoryProjects, useInventoryUnits } from '@/hooks/useInventory'

export function UnitsView({ projectId = null }) {
    const canManage = usePermission('manage_inventory')
    const canEdit = usePermission('edit_inventory')

    // 1. Parallel Fetching with specialized hooks
    const { 
        data: units = [], 
        isLoading: unitsLoading,
        refetch: refetchUnits
    } = useInventoryUnits(projectId)

    const { 
        data: projects = [], 
        isLoading: projectsLoading 
    } = useInventoryProjects()

    const loading = unitsLoading || projectsLoading

    const fetchData = () => {
        refetchUnits()
    }

    const [search, setSearch] = useState('')

    // Filter states
    const [selectedTypes, setSelectedTypes] = useState([])
    const [selectedStatuses, setSelectedStatuses] = useState([])
    const [selectedProjects, setSelectedProjects] = useState([])

    // Additional Filter states
    const [priceRange, setPriceRange] = useState({ min: '', max: '' })
    const [areaRange, setAreaRange] = useState({ min: '', max: '' })
    const [bedrooms, setBedrooms] = useState([])
    const [bathrooms, setBathrooms] = useState([])

    // UI States
    const [isAddUnitOpen, setIsAddUnitOpen] = useState(false)

    const unitTypes = [
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
        { value: 'reserved', label: 'Reserved', color: 'bg-amber-500' },
        { value: 'blocked', label: 'Blocked', color: 'bg-red-500' },
        { value: 'under_maintenance', label: 'Maintenance', color: 'bg-orange-500' }
    ]



    // Filter logic
    const filteredUnits = units.filter(unit => {
        // Search filter
        const matchesSearch = !search ||
            unit.unit_number?.toLowerCase().includes(search.toLowerCase()) ||
            unit.title?.toLowerCase().includes(search.toLowerCase())

        // Type filter
        const matchesType = selectedTypes.length === 0 ||
            selectedTypes.includes(unit.config?.property_type) || 
            selectedTypes.includes(unit.type)

        // Status filter
        const matchesStatus = selectedStatuses.length === 0 ||
            selectedStatuses.includes(unit.status)

        // Project filter
        const matchesProject = selectedProjects.length === 0 ||
            selectedProjects.includes(unit.project_id)

        // Price filter
        const price = parseInt(unit.total_price || unit.base_price) || 0
        const matchesPriceMin = !priceRange.min || price >= parseInt(priceRange.min)
        const matchesPriceMax = !priceRange.max || price <= parseInt(priceRange.max)

        // Area filter
        const area = parseInt(unit.carpet_area || unit.size_sqft) || 0
        const matchesAreaMin = !areaRange.min || area >= parseInt(areaRange.min)
        const matchesAreaMax = !areaRange.max || area <= parseInt(areaRange.max)

        // Beds filter
        const beds = unit.bedrooms || unit.config?.bedrooms || 0
        const matchesBeds = bedrooms.length === 0 || bedrooms.includes(beds.toString())

        // Baths filter
        const baths = unit.bathrooms || unit.config?.bathrooms || 0
        const matchesBaths = bathrooms.length === 0 || bathrooms.includes(baths.toString())

        return matchesSearch && matchesType && matchesStatus && matchesProject &&
            matchesPriceMin && matchesPriceMax && matchesAreaMin && matchesAreaMax &&
            matchesBeds && matchesBaths
    })

    const toggleFilter = (filterArray, setFilterArray, value) => {
        if (filterArray.includes(value)) {
            setFilterArray(filterArray.filter(v => v !== value))
        } else {
            setFilterArray([...filterArray, value])
        }
    }

    const clearAllFilters = () => {
        setSelectedTypes([])
        setSelectedStatuses([])
        setPriceRange({ min: '', max: '' })
        setAreaRange({ min: '', max: '' })
        setBedrooms([])
        setBathrooms([])
        if (!projectId) setSelectedProjects([])
        setSearch('')
    }

    const hasActiveFilters = selectedTypes.length > 0 ||
        selectedStatuses.length > 0 ||
        selectedProjects.length > 0 ||
        search ||
        priceRange.min || priceRange.max ||
        areaRange.min || areaRange.max ||
        bedrooms.length > 0 || bathrooms.length > 0

    return (
        <div className="flex flex-col h-full bg-slate-50/50">
            {/* Filters Bar */}
            <div className="flex flex-col gap-4 p-6 border-b border-border bg-white shadow-sm shrink-0">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    {/* Search */}
                    <div className="relative flex-1 w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search units..."
                            className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-sm font-medium"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {canManage && (
                        <Button onClick={() => setIsAddUnitOpen(true)} className="bg-blue-600 hover:bg-blue-700 h-11 px-6 font-bold shadow-lg shadow-blue-200 uppercase tracking-wider text-xs">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Unit
                        </Button>
                    )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap items-center gap-2">

                    {/* Project Filter */}
                    {!projectId && projects.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 border-dashed rounded-full px-4 hover:bg-slate-50">
                                    <Building2 className="w-3.5 h-3.5 mr-2" />
                                    Project
                                    {selectedProjects.length > 0 && (
                                        <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                                            {selectedProjects.length}
                                        </Badge>
                                    )}
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
                                            <span className="font-medium">{project.name}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {project.total_units} units
                                            </span>
                                        </div>
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Price Range Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border-dashed rounded-full px-4 hover:bg-slate-50">
                                <IndianRupee className="w-3.5 h-3.5 mr-2" />
                                Price
                                {(priceRange.min || priceRange.max) && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                                        Active
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80 p-5">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm tracking-tight">Price Range</h4>
                                    <p className="text-[11px] text-muted-foreground font-medium">Filter units by price in ₹</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min</Label>
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            className="h-10 text-xs font-bold"
                                            value={priceRange.min}
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max</Label>
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            className="h-10 text-xs font-bold"
                                            value={priceRange.max}
                                            onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Area Range Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border-dashed rounded-full px-4 hover:bg-slate-50">
                                <Maximize className="w-3.5 h-3.5 mr-2" />
                                Area
                                {(areaRange.min || areaRange.max) && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                                        Active
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-80 p-5">
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-sm tracking-tight">Area Range (Sq Ft)</h4>
                                    <p className="text-[11px] text-muted-foreground font-medium">Surface area in sq ft</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Area</Label>
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            className="h-10 text-xs font-bold"
                                            value={areaRange.min}
                                            onChange={(e) => setAreaRange(prev => ({ ...prev, min: e.target.value }))}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Max Area</Label>
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            className="h-10 text-xs font-bold"
                                            value={areaRange.max}
                                            onChange={(e) => setAreaRange(prev => ({ ...prev, max: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Type Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border-dashed rounded-full px-4 hover:bg-slate-50">
                                <Home className="w-3.5 h-3.5 mr-2" />
                                Type
                                {selectedTypes.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                                        {selectedTypes.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Select Type</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {unitTypes.map(type => (
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
                            <Button variant="outline" size="sm" className="h-9 border-dashed rounded-full px-4 hover:bg-slate-50">
                                <Info className="w-3.5 h-3.5 mr-2" />
                                Status
                                {selectedStatuses.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                                        {selectedStatuses.length}
                                    </Badge>
                                )}
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

                    {/* Bedrooms Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 border-dashed rounded-full px-4 hover:bg-slate-50">
                                <BedDouble className="w-3.5 h-3.5 mr-2" />
                                Beds
                                {bedrooms.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] font-bold bg-blue-100 text-blue-700">
                                        {bedrooms.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-48">
                            <DropdownMenuLabel>Bedrooms</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {['1', '2', '3', '4', '5'].map(num => (
                                <DropdownMenuCheckboxItem
                                    key={num}
                                    checked={bedrooms.includes(num)}
                                    onCheckedChange={() => toggleFilter(bedrooms, setBedrooms, num)}
                                >
                                    {num} {num === '5' ? '+' : ''} Beds
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full px-4"
                            onClick={clearAllFilters}
                        >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Clear All
                        </Button>
                    )}
                </div>

                {/* Active Filter Badges */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                        {priceRange.min && <Badge variant="secondary" className="h-6 px-3 bg-white border-slate-200 text-[10px] font-bold">Min: ₹{priceRange.min}</Badge>}
                        {priceRange.max && <Badge variant="secondary" className="h-6 px-3 bg-white border-slate-200 text-[10px] font-bold">Max: ₹{priceRange.max}</Badge>}
                        {areaRange.min && <Badge variant="secondary" className="h-6 px-3 bg-white border-slate-200 text-[10px] font-bold">Min Area: {areaRange.min}</Badge>}
                        {areaRange.max && <Badge variant="secondary" className="h-6 px-3 bg-white border-slate-200 text-[10px] font-bold">Max Area: {areaRange.max}</Badge>}

                        {selectedTypes.map(type => (
                            <Badge key={type} variant="secondary" className="h-6 px-3 bg-blue-50 text-blue-700 border-blue-100 capitalize text-[10px] font-bold">
                                {type}
                                <X className="w-3 h-3 ml-1.5 cursor-pointer hover:text-destructive" onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type)} />
                            </Badge>
                        ))}
                        {selectedStatuses.map(status => (
                            <Badge key={status} variant="secondary" className="h-6 px-3 bg-white border-slate-200 capitalize text-[10px] font-bold">
                                {status}
                                <X className="w-3 h-3 ml-1.5 cursor-pointer hover:text-destructive" onClick={() => toggleFilter(selectedStatuses, setSelectedStatuses, status)} />
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Units Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Found {filteredUnits.length} results
                    </h2>
                </div>

                {loading ? (
                    <div className="flex bg-white rounded-2xl border border-border h-64 items-center justify-center shadow-sm">
                        <LoadingSpinner />
                    </div>
                ) : filteredUnits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-20 text-center border border-dashed rounded-2xl bg-white shadow-sm border-slate-200">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-6">
                            <Filter className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight">No Units Match Your Search</h3>
                        <p className="text-muted-foreground text-sm mt-2 max-w-sm font-medium">
                            {hasActiveFilters ? 'We couldn\'t find any units with these filters. Try clearing some selections.' : 'There are no units in this project yet.'}
                        </p>
                        <Button variant="outline" size="sm" className="mt-8 rounded-full h-10 px-6" onClick={clearAllFilters}>
                            Clear All Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUnits.map(unit => (
                            <UnitCard
                                key={unit.id}
                                unit={unit}
                                onActionComplete={fetchData}
                                canManage={canManage}
                                canEdit={canEdit}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Unit Modal */}
            <EditUnitModal
                isOpen={isAddUnitOpen}
                onClose={() => setIsAddUnitOpen(false)}
                onActionComplete={fetchData}
            />
        </div>
    )
}
