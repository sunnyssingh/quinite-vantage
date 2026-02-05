'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Bed, Bath, Layout, EyeOff, Eye } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Image from 'next/image'

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

    // Use first image or placeholder
    const imageUrl = property.images && property.images.length > 0
        ? property.images[0].url
        : '/placeholder-property.jpg'

    return (
        <Card className="rounded-xl border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
            <div className="relative h-48 w-full bg-muted/30">
                {/* We use a simple div for now if no real image logic is setup, or normal img tag if external url */}
                {imageUrl.startsWith('/') ? (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
                        No Image
                    </div>
                ) : (
                    <img
                        src={imageUrl}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                    {property.show_in_crm === false && (
                        <Badge variant="destructive" className="bg-red-500/90 text-white h-5 px-1.5" title="Hidden from CRM">
                            <EyeOff className="w-3 h-3" />
                        </Badge>
                    )}
                    <Badge variant={property.status === 'available' ? 'default' : 'secondary'} className="uppercase text-[10px] font-medium tracking-wide">
                        {property.status}
                    </Badge>
                </div>
                <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-background/80 text-foreground backdrop-blur-sm border-0 font-medium text-[10px]">
                        {property.type}
                    </Badge>
                </div>
            </div>

            <CardHeader className="p-4 pb-2 space-y-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-medium text-lg leading-tight truncate text-foreground" title={property.title}>{property.title}</h3>
                    <span className="font-bold text-foreground">₹{parseInt(property.price).toLocaleString('en-IN')}</span>
                </div>
                {property.address && (
                    <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3 mr-1" />
                        <span className="truncate">{property.address}</span>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-4 pt-2 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
                    <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5" />
                        <span>{property.bedrooms || 0} Beds</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5" />
                        <span>{property.bathrooms || 0} Baths</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Layout className="w-3.5 h-3.5" />
                        <span>{property.size_sqft || 0} sqft</span>
                    </div>
                </div>

                {/* CRM Visibility Toggle and Actions */}
                <div className="flex gap-2">
                    <Button
                        variant={property.show_in_crm ? "outline" : "default"}
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={toggleCrmVisibility}
                        disabled={toggling}
                    >
                        {property.show_in_crm ? (
                            <>
                                <Eye className="w-3.5 h-3.5 mr-1.5" />
                                CRM
                            </>
                        ) : (
                            <>
                                <EyeOff className="w-3.5 h-3.5 mr-1.5" />
                                Hide
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsEditOpen(true)}
                        title="Edit Details"
                    >
                        <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setIsStatusOpen(true)}
                        title="Change Status"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
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
