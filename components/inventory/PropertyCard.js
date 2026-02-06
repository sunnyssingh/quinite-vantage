'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bed, Bath, Layout, EyeOff, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'

import EditPropertyModal from './EditPropertyModal'
import StatusChangeModal from './StatusChangeModal'
import { Edit, RefreshCcw } from 'lucide-react'

export function PropertyCard({ property: initialProperty }) {
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
            case 'available':
                return {
                    bg: 'bg-emerald-500',
                    text: 'text-white',
                    label: 'Available',
                    icon: '✓'
                }
            case 'sold':
                return {
                    bg: 'bg-slate-500',
                    text: 'text-white',
                    label: 'Sold',
                    icon: '✓'
                }
            case 'reserved':
                return {
                    bg: 'bg-amber-500',
                    text: 'text-white',
                    label: 'Reserved',
                    icon: '⏱'
                }
            default:
                return {
                    bg: 'bg-blue-500',
                    text: 'text-white',
                    label: status,
                    icon: ''
                }
        }
    }

    const statusConfig = getStatusConfig(property.status)

    return (
        <Card className="rounded-xl border-border bg-card shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
            {/* Header with Badges */}
            <CardHeader className="p-4 pb-3 space-y-2 bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex gap-2 flex-wrap">
                        {/* Status Badge */}
                        <Badge className={`${statusConfig.bg} ${statusConfig.text} uppercase text-[10px] font-semibold tracking-wide h-6 px-2.5 shadow-sm`}>
                            {statusConfig.icon && <span className="mr-1">{statusConfig.icon}</span>}
                            {statusConfig.label}
                        </Badge>

                        {/* Type Badge */}
                        <Badge variant="secondary" className="bg-white text-foreground border border-slate-200 font-semibold text-xs h-6 px-2.5 capitalize">
                            {property.type.replace('_', ' ')}
                        </Badge>
                    </div>

                    {/* CRM Visibility Badge */}
                    {property.show_in_crm === false && (
                        <Badge variant="destructive" className="bg-red-500/95 text-white h-6 px-2 shadow-sm" title="Hidden from CRM">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden
                        </Badge>
                    )}
                </div>

                <div className="flex justify-between items-start gap-2">
                    <h3 className="font-semibold text-lg leading-tight text-foreground flex-1" title={property.title}>
                        {property.title}
                    </h3>
                    <div className="text-right">
                        <div className="text-lg font-bold text-blue-600">
                            ₹{(parseInt(property.price) / 100000).toFixed(2)}L
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                            {parseInt(property.price).toLocaleString('en-IN')}
                        </div>
                    </div>
                </div>
                {property.address && (
                    <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                        <span className="truncate">{property.address}</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-3 gap-3 text-xs border-t border-border pt-3">
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Bed className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-foreground">{property.bedrooms || 0}</span>
                        <span className="text-muted-foreground text-[10px]">Beds</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Bath className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-foreground">{property.bathrooms || 0}</span>
                        <span className="text-muted-foreground text-[10px]">Baths</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        <Layout className="w-4 h-4 text-slate-600" />
                        <span className="font-semibold text-foreground">{property.size_sqft || 0}</span>
                        <span className="text-muted-foreground text-[10px]">sqft</span>
                    </div>
                </div>

                {/* CRM Visibility Toggle and Actions */}
                <div className="flex gap-2">
                    <Button
                        variant={property.show_in_crm ? "outline" : "default"}
                        size="sm"
                        className={`flex-1 h-9 text-xs font-medium ${property.show_in_crm ? 'hover:bg-blue-50' : ''}`}
                        onClick={toggleCrmVisibility}
                        disabled={toggling}
                    >
                        {property.show_in_crm ? (
                            <>
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                Visible in CRM
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                                Hidden
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                        onClick={() => setIsEditOpen(true)}
                        title="Edit Details"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                        onClick={() => setIsStatusOpen(true)}
                        title="Change Status"
                    >
                        <RefreshCcw className="w-4 h-4" />
                    </Button>
                </div>

                <EditPropertyModal
                    property={property}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onUpdate={(updatedProp) => setProperty(updatedProp)}
                />

                <StatusChangeModal
                    property={property}
                    isOpen={isStatusOpen}
                    onClose={() => setIsStatusOpen(false)}
                    onStatusChanged={(updatedProp) => setProperty(updatedProp)}
                />
            </CardContent>
        </Card>
    )
}
