'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Edit, RefreshCcw, Home, Building2, Store, Factory, LandPlot, CheckCircle2, User, Layers } from 'lucide-react'
import EditPropertyModal from '@/components/inventory/EditPropertyModal'
import StatusChangeModal from '@/components/inventory/StatusChangeModal'

export default function VisualUnitGrid({ projectId, onMetricsUpdate }) {
    const [properties, setProperties] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedProperty, setSelectedProperty] = useState(null)
    const [statusModalOpen, setStatusModalOpen] = useState(false)

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
        if (onMetricsUpdate) {
            // Parent refresh logic would go here
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'
            case 'reserved': return 'bg-amber-400 hover:bg-amber-500 border-amber-500'
            case 'sold': return 'bg-rose-500 hover:bg-rose-600 border-rose-600'
            default: return 'bg-slate-500 hover:bg-slate-600 border-slate-600'
        }
    }

    const getPropertyIcon = (type) => {
        const t = (type || '').toLowerCase()
        if (t.includes('villa') || t.includes('bungalow')) return Home
        if (t.includes('commercial') || t.includes('office') || t.includes('shop')) return Store
        if (t.includes('industrial')) return Factory
        if (t.includes('plot') || t.includes('land')) return LandPlot
        return Building2 // Default to apartment
    }

    const handleUnitClick = (property) => {
        setSelectedProperty(property)
        setStatusModalOpen(true)
    }

    // Group properties by Block
    const groupedProperties = properties.reduce((acc, prop) => {
        const block = prop.block_name || 'Unassigned'
        if (!acc[block]) acc[block] = []
        acc[block].push(prop)
        return acc
    }, {})

    // Sort blocks (A, B, C...) and units
    const sortedBlocks = Object.keys(groupedProperties).sort()

    // Sort units within blocks
    sortedBlocks.forEach(block => {
        groupedProperties[block].sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
        )
    })

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
                    <p className="text-xs mt-1">Go to "Edit Project" to bulk generate units.</p>
                </div>
            ) : (
                sortedBlocks.map(block => {
                    // Group by Floor within Block
                    const blockProps = groupedProperties[block]
                    // Group by floor
                    const floorGroups = blockProps.reduce((acc, prop) => {
                        // Normalize floor number for sorting
                        // Try to parse floor number. If standard numeric string, easy.
                        // If "Ground", "G", etc., handle appropriately or treat as 0.
                        const floorKey = prop.floor_number || 'Unassigned'
                        if (!acc[floorKey]) acc[floorKey] = []
                        acc[floorKey].push(prop)
                        return acc
                    }, {})

                    // Sort floors descending (building view)
                    const sortedFloors = Object.keys(floorGroups).sort((a, b) => {
                        // Check for numeric floors
                        const numA = parseInt(a)
                        const numB = parseInt(b)

                        // Handle non-numeric cases (like 'Unassigned' or 'Ground')
                        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b)
                        if (isNaN(numA)) return 1 // Non-numbers at bottom
                        if (isNaN(numB)) return -1

                        return numB - numA // Descending
                    })

                    // Sort units within floors
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
                                                return (
                                                    <TooltipProvider key={property.id}>
                                                        <Tooltip delayDuration={300}>
                                                            <TooltipTrigger asChild>
                                                                <button
                                                                    onClick={() => handleUnitClick(property)}
                                                                    className={`
                                                                          aspect-square rounded-lg border-b-4 transition-all active:scale-95 flex flex-col items-center justify-center p-2 gap-1 text-white shadow-sm relative overflow-hidden group
                                                                          ${getStatusColor(property.status)}
                                                                      `}
                                                                >
                                                                    <Icon className="w-4 h-4 opacity-90 group-hover:scale-110 transition-transform" />
                                                                    <span className="font-bold text-[10px] sm:text-xs truncate w-full text-center leading-tight">
                                                                        {property.unit_number || property.title.replace(/^(Unit|Flat|Apt)\s*/i, '')}
                                                                    </span>
                                                                    {property.configuration && (
                                                                        <span className="absolute top-1 right-1 text-[7px] bg-black/20 px-1 rounded backdrop-blur-[1px]">
                                                                            {property.configuration}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top">
                                                                <div className="text-xs space-y-1">
                                                                    <p className="font-bold border-b pb-1 mb-1">{property.title}</p>
                                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                                                        <span className="text-muted-foreground">Type:</span> <span>{property.configuration}</span>
                                                                        <span className="text-muted-foreground">Area:</span> <span>{property.size_sqft} sqft</span>
                                                                        <span className="text-muted-foreground">Price:</span> <span>₹{parseInt(property.price).toLocaleString()}</span>
                                                                        <span className="text-muted-foreground">Status:</span> <span className="capitalize font-medium">{property.status}</span>
                                                                    </div>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
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
