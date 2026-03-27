'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    MapPin, Bed, Bath, Layout, EyeOff, Eye, Lock,
    Building2, Edit, RefreshCcw, Maximize
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import EditPropertyModal from './EditPropertyModal'
import StatusChangeModal from './StatusChangeModal'

import { formatINR } from '@/lib/inventory'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function PropertyCard({ property: initialProperty, onActionComplete, canManage = false, canEdit = false }) {
    const [property, setProperty] = useState(initialProperty)
    const [toggling, setToggling] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isStatusOpen, setIsStatusOpen] = useState(false)

    const toggleCrmVisibility = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setToggling(true)
        try {
            const res = await fetch(`/api/inventory/properties/${property.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ show_in_crm: !property.show_in_crm })
            })
            if (!res.ok) throw new Error('Failed to update visibility')
            const data = await res.json()
            setProperty(data.property)
            toast.success(data.property.show_in_crm ? 'Now visible in CRM' : 'Hidden from CRM')
        } catch (error) {
            toast.error('Failed to update visibility')
        } finally {
            setToggling(false)
        }
    }

    // Status badge configuration
    const getStatusConfig = (status) => {
        switch (status) {
            case 'available': return { bg: 'bg-emerald-500', text: 'text-white', label: 'Available', icon: '✓' }
            case 'sold': return { bg: 'bg-slate-500', text: 'text-white', label: 'Sold', icon: '✓' }
            case 'reserved': return { bg: 'bg-amber-500', text: 'text-white', label: 'Reserved', icon: '⏱' }
            case 'blocked': return { bg: 'bg-red-500', text: 'text-white', label: 'Blocked', icon: '✕' }
            case 'under_maintenance': return { bg: 'bg-purple-500', text: 'text-white', label: 'Maintenance', icon: '🔧' }
            default: return { bg: 'bg-blue-500', text: 'text-white', label: status, icon: '' }
        }
    }

    const statusConfig = getStatusConfig(property.status)
    const coverImage = property.images && property.images.length > 0
        ? property.images.find(img => img.is_featured)?.url || property.images[0].url
        : null

    return (
        <TooltipProvider>
        <Card className="rounded-xl border-border bg-card shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group flex flex-col h-full">
            {/* Image Area */}
            <div className="relative h-48 bg-slate-100 dark:bg-slate-800">
                {coverImage ? (
                    <img
                        src={coverImage}
                        alt={property.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Layout className="w-12 h-12 opacity-20" />
                    </div>
                )}

                {/* Overlay Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                    <Badge className={`${statusConfig.bg} ${statusConfig.text} uppercase text-[10px] font-semibold tracking-wide h-6 px-2.5 shadow-sm border-0`}>
                        {statusConfig.icon && <span className="mr-1">{statusConfig.icon}</span>}
                        {statusConfig.label}
                    </Badge>
                </div>

                <div className="absolute top-3 right-3">
                    {property.show_in_crm === false && (
                        <Badge variant="destructive" className="bg-red-500/90 text-white h-6 px-2 shadow-sm backdrop-blur-sm">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                        </Badge>
                    )}
                </div>

                {/* Price Tag Overlay */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-md cursor-help">
                            <div className="text-lg font-bold">
                                {formatINR(property.price)}
                            </div>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent className="p-3">
                        <div className="space-y-1 text-xs">
                            <p className="flex justify-between gap-4"><span>Base Price:</span> <b>{formatINR(property.base_price)}</b></p>
                            <p className="flex justify-between gap-4"><span>Floor Rise:</span> <b>{formatINR(property.floor_rise_price)}</b></p>
                            <p className="flex justify-between gap-4"><span>PLC Charges:</span> <b>{formatINR(property.plc_price)}</b></p>
                            <div className="h-[1px] bg-white/20 my-1" />
                            <p className="flex justify-between gap-4 font-bold"><span>Final Price:</span> <span>{formatINR(property.price)}</span></p>
                        </div>
                    </TooltipContent>
                </Tooltip>
            </div>

            {/* Content */}
            <CardHeader className="p-4 pb-2 space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            {property.towers?.name && (
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 text-[9px] h-4 py-0 px-1.5 uppercase font-bold">
                                    {property.towers.name}
                                </Badge>
                            )}
                            {property.unit_number && (
                                <span className="text-[10px] font-black text-slate-400">#{property.unit_number}</span>
                            )}
                        </div>
                        <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-1" title={property.title}>
                            {property.title}
                        </h3>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-border text-[10px] h-5 px-1.5 capitalize shrink-0">
                        {property.unit_config || property.type}
                    </Badge>
                </div>

                <div className="flex items-center gap-3 text-[10px] uppercase tracking-wider font-bold text-slate-500 pt-1">
                    {property.floor_number !== undefined && (
                        <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {property.floor_number === 0 ? 'Ground' : `Floor ${property.floor_number}`}
                        </span>
                    )}
                    {property.address && (
                        <div className="flex items-center truncate max-w-[150px]">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{property.address}</span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-4 flex-1 flex flex-col justify-end">
                <div className="grid grid-cols-3 gap-2 text-xs border-t border-border pt-3 mt-2">
                    <div className="flex flex-col items-center gap-0.5 p-1.5 rounded bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-1 text-slate-500">
                            <Bed className="w-3 h-3" />
                            <span>Beds</span>
                        </div>
                        <span className="font-semibold">{property.bedrooms || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 p-1.5 rounded bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-1 text-slate-500">
                            <Bath className="w-3 h-3" />
                            <span>Baths</span>
                        </div>
                        <span className="font-semibold">{property.bathrooms || '-'}</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 p-1.5 rounded bg-slate-50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-1 text-slate-500">
                            <Maximize className="w-3 h-3" />
                            <span>Area</span>
                        </div>
                        <span className="font-semibold">{property.size_sqft ? `${property.size_sqft} sqft` : '-'}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-2">
                    <Button
                        variant={property.show_in_crm ? "outline" : "default"}
                        size="sm"
                        className={`flex-1 h-8 text-xs ${property.show_in_crm ? 'hover:bg-blue-50 text-slate-600' : ''}`}
                        onClick={toggleCrmVisibility}
                        disabled={toggling || (!canManage && !canEdit)}
                    >
                        {property.show_in_crm ? (
                            <>
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Visible
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                                Hidden
                            </>
                        )}
                    </Button>
                    <div className="flex gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                            onClick={() => setIsEditOpen(true)}
                            title="Edit Details"
                            disabled={!canEdit && !canManage}
                        >
                            {(!canEdit && !canManage) ? <Lock className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                            onClick={() => setIsStatusOpen(true)}
                            title="Change Status"
                            disabled={!canEdit && !canManage}
                        >
                            {(!canEdit && !canManage) ? <Lock className="w-3.5 h-3.5" /> : <RefreshCcw className="w-3.5 h-3.5" />}
                        </Button>
                    </div>
                </div>

                <EditPropertyModal
                    property={property}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onPropertyUpdated={(updatedProp) => {
                        setProperty(updatedProp)
                        if (onActionComplete) onActionComplete()
                    }}
                    onActionComplete={onActionComplete}
                />

                <StatusChangeModal
                    property={property}
                    isOpen={isStatusOpen}
                    onClose={() => setIsStatusOpen(false)}
                    onStatusChanged={(updatedProp) => {
                        setProperty(updatedProp)
                        if (onActionComplete) onActionComplete()
                    }}
                />
            </CardContent>
        </Card>
        </TooltipProvider>
    )
}
