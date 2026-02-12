'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bed, Bath, Layout, EyeOff, Eye, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'

import EditPropertyModal from './EditPropertyModal'
import StatusChangeModal from './StatusChangeModal'
import { Edit, RefreshCcw, Maximize } from 'lucide-react'

export function PropertyCard({ property: initialProperty, onActionComplete, canManage = false, canEdit = false }) {
    const [property, setProperty] = useState(initialProperty)
    // ...

    const [toggling, setToggling] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isStatusOpen, setIsStatusOpen] = useState(false)

    const toggleCrmVisibility = async (e) => {
        e.preventDefault()
        e.stopPropagation()
        // ... (rest of function is fine, but I'm replacing the top block mainly)


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
            case 'available':
                return { bg: 'bg-emerald-500', text: 'text-white', label: 'Available', icon: '✓' }
            case 'sold':
                return { bg: 'bg-slate-500', text: 'text-white', label: 'Sold', icon: '✓' }
            case 'reserved':
                return { bg: 'bg-amber-500', text: 'text-white', label: 'Reserved', icon: '⏱' }
            default:
                return { bg: 'bg-blue-500', text: 'text-white', label: status, icon: '' }
        }
    }

    const statusConfig = getStatusConfig(property.status)
    const coverImage = property.images && property.images.length > 0
        ? property.images.find(img => img.is_featured)?.url || property.images[0].url
        : null

    return (
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
                <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded-md">
                    <div className="text-lg font-bold">
                        ₹{(parseInt(property.price) / 100000).toFixed(2)}L
                    </div>
                </div>
            </div>

            {/* Content */}
            <CardHeader className="p-4 pb-2 space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <div>
                        {property.project?.name && (
                            <div className="text-xs font-semibold text-blue-600 mb-0.5">
                                {property.project.name}
                            </div>
                        )}
                        <h3 className="font-semibold text-base leading-tight text-foreground line-clamp-1" title={property.title}>
                            {property.title}
                        </h3>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-border text-[10px] h-5 px-1.5 capitalize shrink-0">
                        {property.type}
                    </Badge>
                </div>

                {property.address && (
                    <div className="flex items-center text-xs text-muted-foreground pt-1">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{property.address}</span>
                    </div>
                )}
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
    )
}
