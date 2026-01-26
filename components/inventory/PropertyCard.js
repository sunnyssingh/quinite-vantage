import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Bed, Bath, Layout } from 'lucide-react'
import Image from 'next/image'

export function PropertyCard({ property }) {
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
                <div className="absolute top-2 right-2">
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

            <CardContent className="p-4 pt-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3 mt-2">
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
            </CardContent>
        </Card>
    )
}
