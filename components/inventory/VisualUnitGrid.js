'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import {
    Edit, Home, Building2, Store, Factory, LandPlot, Layers,
    User, IndianRupee, Maximize2, ChevronDown
} from 'lucide-react'
import EditPropertyModal from '@/components/inventory/EditPropertyModal'
import StatusChangeModal from '@/components/inventory/StatusChangeModal'

export default function VisualUnitGrid({ projectId, onMetricsUpdate }) {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [statusModalOpen, setStatusModalOpen] = useState(false)
    const [hoveredId, setHoveredId] = useState(null)

    useEffect(() => {
        fetchProperties()
    }, [projectId])

    const fetchProperties = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/inventory/properties?project_id=${projectId}`)
            const data = await res.json()
            setProperties(data.properties || [])
        } catch (error) {
            console.error('Failed to load properties', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = (updatedProp) => {
        setProperties(prev => prev.map(p => p.id === updatedProp.id ? updatedProp : p))
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-700'
            case 'reserved': return 'bg-amber-400 hover:bg-amber-500 border-amber-600'
            case 'sold': return 'bg-rose-500 hover:bg-rose-600 border-rose-700'
            default: return 'bg-slate-400 hover:bg-slate-500 border-slate-600'
        }
    }

    const getStatusBadgeColor = (status) => {
        switch (status) {
            case 'available': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'reserved': return 'bg-amber-100 text-amber-800 border-amber-200'
            case 'sold': return 'bg-rose-100 text-rose-800 border-rose-200'
            default: return 'bg-slate-100 text-slate-600 border-slate-200'
        }
    }

    const getPropertyIcon = (type) => {
        const t = (type || '').toLowerCase()
        if (t.includes('villa') || t.includes('bungalow')) return Home
        if (t.includes('commercial') || t.includes('office') || t.includes('shop')) return Store
        if (t.includes('industrial')) return Factory
        if (t.includes('plot') || t.includes('land')) return LandPlot
        return Building2
    }

    const handleUnitClick = (property) => {
        setHoveredId(null)
        setSelectedProperty(property)
        setStatusModalOpen(true)
    }

    /** Get the first lead associated with a property */
    const getPrimaryLead = (property) => {
        const leads = property.leads
        if (!leads || leads.length === 0) return null
        // For sold/reserved, show the most relevant lead
        if (property.status === 'sold') {
            return leads.find(l => l.status === 'won' || l.status === 'closed') || leads[0]
        }
        if (property.status === 'reserved') {
            return leads.find(l => l.status === 'active' || l.status === 'new') || leads[0]
        }
        return leads[0]
    }

    // Group properties by Block
    const groupedProperties = properties.reduce((acc, prop) => {
        const block = prop.block_name || 'Unassigned'
        if (!acc[block]) acc[block] = []
        acc[block].push(prop)
        return acc
    }, {})

    const sortedBlocks = Object.keys(groupedProperties).sort()

    sortedBlocks.forEach(block => {
        groupedProperties[block].sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
        )
    })

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
                <div className="animate-pulse space-y-2 text-center">
                    <Layers className="w-8 h-8 mx-auto opacity-30" />
                    <p className="text-sm">Loading inventory...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 bg-background p-3 rounded-lg border shadow-sm w-fit">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                    <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-amber-400" />
                    <span className="text-sm">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-sm bg-rose-500" />
                    <span className="text-sm">Sold</span>
                </div>
            </div>

            {/* Render Groups */}
            {properties.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                    <Layers className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>No inventory units created yet.</p>
                    <p className="text-xs mt-1">Go to &quot;Edit Project&quot; to bulk generate units.</p>
                </div>
            ) : (
                sortedBlocks.map(block => {
                    const blockProps = groupedProperties[block]

                    const floorGroups = blockProps.reduce((acc, prop) => {
                        const floorKey = prop.floor_number || 'Unassigned'
                        if (!acc[floorKey]) acc[floorKey] = []
                        acc[floorKey].push(prop)
                        return acc
                    }, {})

                    const sortedFloors = Object.keys(floorGroups).sort((a, b) => {
                        const numA = parseInt(a)
                        const numB = parseInt(b)
                        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b)
                        if (isNaN(numA)) return 1
                        if (isNaN(numB)) return -1
                        return numB - numA
                    })

                    sortedFloors.forEach(f => {
                        floorGroups[f].sort((a, b) =>
                            a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
                        )
                    })

                    return (
                        <div key={block} className="space-y-4 pt-4 first:pt-0">
                            {block !== 'Unassigned' && (
                                <div className="flex items-center gap-2 text-base font-semibold text-foreground border-b pb-2">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    Block {block}
                                    <Badge variant="secondary" className="ml-2">
                                        {blockProps.length} Units
                                    </Badge>
                                </div>
                            )}

                            <div className="space-y-4">
                                {sortedFloors.map(floor => (
                                    <div key={floor} className="flex flex-col sm:flex-row gap-4 border-l-2 border-slate-200 pl-4 py-1">
                                        {/* Floor Label */}
                                        <div className="w-full sm:w-24 shrink-0 flex items-start pt-2">
                                            <div className="bg-slate-100 px-3 py-1 rounded text-xs font-semibold text-slate-600 w-full text-center sm:text-left">
                                                {floor === '0' || floor === 'Unassigned' ? floor : `Floor ${floor}`}
                                            </div>
                                        </div>

                                        {/* Units Grid */}
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                                            {floorGroups[floor].map(property => {
                                                const Icon = getPropertyIcon(property.type)
                                                const isHovered = hoveredId === property.id
                                                const primaryLead = getPrimaryLead(property)
                                                const showLead = (property.status === 'sold' || property.status === 'reserved') && primaryLead

                                                return (
                                                    <div key={property.id} className="relative group">
                                                        {/* Unit Button */}
                                                        <button
                                                            onClick={() => handleUnitClick(property)}
                                                            onMouseEnter={() => setHoveredId(property.id)}
                                                            onMouseLeave={() => setHoveredId(null)}
                                                            className={`
                                                                w-full aspect-square rounded-lg border-b-4 transition-all duration-150
                                                                active:scale-95 flex flex-col items-center justify-center p-2 gap-0.5
                                                                text-white shadow-sm relative overflow-hidden
                                                                ${getStatusColor(property.status)}
                                                            `}
                                                        >
                                                            <Icon className="w-4 h-4 opacity-90 group-hover:scale-110 transition-transform shrink-0" />
                                                            <span className="font-bold text-[10px] sm:text-[11px] truncate w-full text-center leading-tight">
                                                                {property.unit_number || property.title.replace(/^(Unit|Flat|Apt)\s*/i, '')}
                                                            </span>
                                                            {/* Lead name shown on card for sold/reserved */}
                                                            {showLead && (
                                                                <span className="text-[7px] truncate w-full text-center opacity-90 leading-tight font-medium bg-black/20 px-1 rounded">
                                                                    {primaryLead.name?.split(' ')[0]}
                                                                </span>
                                                            )}
                                                            {property.configuration && (
                                                                <span className="absolute top-0.5 right-1 text-[7px] bg-black/20 px-1 py-0 rounded backdrop-blur-[1px]">
                                                                    {property.configuration}
                                                                </span>
                                                            )}
                                                        </button>

                                                        {/* Custom Hover Card - Fixed Positioning */}
                                                        {isHovered && (
                                                            <div
                                                                className="absolute z-50 bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none"
                                                                onMouseEnter={() => setHoveredId(property.id)}
                                                            >
                                                                {/* Arrow */}
                                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-slate-800" />

                                                                <div className="bg-slate-800 text-white rounded-xl shadow-2xl p-3 w-52 text-xs space-y-2 border border-slate-700">
                                                                    {/* Header */}
                                                                    <div className="flex items-center justify-between border-b border-slate-600 pb-2">
                                                                        <p className="font-bold text-sm text-white truncate">
                                                                            {property.title}
                                                                        </p>
                                                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize border ${getStatusBadgeColor(property.status)}`}>
                                                                            {property.status}
                                                                        </span>
                                                                    </div>

                                                                    {/* Details Grid */}
                                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-slate-300">
                                                                        {property.configuration && (
                                                                            <>
                                                                                <span className="text-slate-400 flex items-center gap-1">
                                                                                    <Building2 className="w-3 h-3" /> Type
                                                                                </span>
                                                                                <span className="font-medium text-white">{property.configuration}</span>
                                                                            </>
                                                                        )}
                                                                        {property.size_sqft && (
                                                                            <>
                                                                                <span className="text-slate-400 flex items-center gap-1">
                                                                                    <Maximize2 className="w-3 h-3" /> Area
                                                                                </span>
                                                                                <span className="font-medium text-white">{property.size_sqft} sqft</span>
                                                                            </>
                                                                        )}
                                                                        {property.price && (
                                                                            <>
                                                                                <span className="text-slate-400 flex items-center gap-1">
                                                                                    <IndianRupee className="w-3 h-3" /> Price
                                                                                </span>
                                                                                <span className="font-medium text-white">
                                                                                    ₹{parseInt(property.price).toLocaleString('en-IN')}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </div>

                                                                    {/* Lead Name for sold/reserved */}
                                                                    {showLead && (
                                                                        <div className="border-t border-slate-600 pt-2 flex items-center gap-2">
                                                                            <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                                                                                <User className="w-3 h-3 text-slate-300" />
                                                                            </div>
                                                                            <div className="overflow-hidden">
                                                                                <p className="text-slate-400 text-[10px] capitalize">
                                                                                    {property.status === 'sold' ? 'Buyer' : 'Reserved by'}
                                                                                </p>
                                                                                <p className="font-semibold text-white truncate">{primaryLead.name}</p>
                                                                                {primaryLead.phone && (
                                                                                    <p className="text-slate-400 text-[10px]">{primaryLead.phone}</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Multiple leads indicator */}
                                                                    {property.leads && property.leads.length > 1 && (
                                                                        <p className="text-slate-400 text-[10px] text-center">
                                                                            +{property.leads.length - 1} more lead{property.leads.length > 2 ? 's' : ''}
                                                                        </p>
                                                                    )}

                                                                    <p className="text-slate-500 text-center text-[10px] pt-1 border-t border-slate-700">
                                                                        Click to change status
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })
            )}

            {/* Modals */}
            {selectedProperty && (
                <StatusChangeModal
                    property={selectedProperty}
                    isOpen={statusModalOpen}
                    onClose={() => {
                        setStatusModalOpen(false)
                        setSelectedProperty(null)
                    }}
                    onStatusChanged={(updatedProp, updatedProjectMetrics) => {
                        handleUpdate(updatedProp)
                        setStatusModalOpen(false)
                        setSelectedProperty(null)
                        if (onMetricsUpdate && updatedProjectMetrics) {
                            onMetricsUpdate(updatedProjectMetrics)
                        }
                    }}
                />
            )}
        </div>
    )
}
