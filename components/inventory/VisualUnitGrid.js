'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Edit, RefreshCcw, Home, CheckCircle2, User } from 'lucide-react'
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
        // If metrics changed (sold/reserved count), notify parent
        if (onMetricsUpdate) {
            // We can't easily calculate metrics here without re-fetching project
            // But the parent might re-fetch if we tell it to.
        }
    }

    const sortedProperties = [...properties].sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
    )

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600'
            case 'reserved': return 'bg-amber-400 hover:bg-amber-500 border-amber-500'
            case 'sold': return 'bg-rose-500 hover:bg-rose-600 border-rose-600'
            default: return 'bg-slate-500 hover:bg-slate-600 border-slate-600'
        }
    }

    const handleUnitClick = (property) => {
        setSelectedProperty(property)
        // Default action: Open Edit or Status? Let's open Status since it's "Inventory Management"
        setStatusModalOpen(true)
    }

    return (
        <div className="space-y-6">

            {/* Legend */}
            <div className="flex items-center gap-4 bg-background p-3 rounded-lg border shadow-sm w-fit">
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

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                {sortedProperties.map(property => (
                    <TooltipProvider key={property.id}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => handleUnitClick(property)}
                                    className={`
                                        aspect-square rounded-lg border-b-4 transition-all active:scale-95 flex flex-col items-center justify-center p-2 gap-1 text-white shadow-sm
                                        ${getStatusColor(property.status)}
                                    `}
                                >
                                    <Home className="w-5 h-5 opacity-80" />
                                    <span className="font-bold text-sm truncate w-full text-center">
                                        {property.title.replace(/^(Unit|Flat|Apt)\s*/i, '')}
                                    </span>
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs">
                                    <p className="font-bold">{property.title}</p>
                                    <p>₹{parseInt(property.price).toLocaleString()}</p>
                                    <p className="capitalize text-muted-foreground">{property.status}</p>
                                    <p className="mt-1 text-[10px] opacity-70">Click to manage</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>

            {/* Modals */}
            {selectedProperty && (
                <>
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

                    {/* We could allow full edit too, maybe add a button in the Status Modal to switch? 
                         For now, clicking the unit opens Status Modal which is the primary "Manage" action.
                     */}
                </>
            )}
        </div>
    )
}
