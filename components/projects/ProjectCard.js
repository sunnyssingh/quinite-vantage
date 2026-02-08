import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Building2,
    Home,
    MapPin,
    Edit,
    Trash2,
    Eye,
    Store,
    LandPlot,
    Briefcase
} from 'lucide-react'

// Helper Components
const PropertyCategoryIcon = ({ category }) => {
    const icons = {
        residential: <Home className="w-4 h-4" />,
        commercial: <Store className="w-4 h-4" />,
        land: <LandPlot className="w-4 h-4" />
    }
    return icons[category] || <Building2 className="w-4 h-4" />
}

const TransactionBadge = ({ transaction }) => {
    return (
        <Badge variant="secondary" className="font-medium text-[10px] uppercase tracking-wider bg-background/80 backdrop-blur-sm border-0">
            {transaction}
        </Badge>
    )
}

export default function ProjectCard({ project, onEdit, onDelete, onView, onStartCampaign, deleting }) {
    const re = project.metadata?.real_estate || project.real_estate || {}

    // Safe accessors
    const property = re.property || {}
    const location = re.location || {}
    const pricing = re.pricing || {}

    // Determine category-specific details string
    const getDetailsString = () => {
        const category = property.category

        // If unit_types exist, show total units count
        if (project.unit_types && project.unit_types.length > 0) {
            const totalUnits = project.unit_types.reduce((sum, ut) => sum + (parseInt(ut.count) || 0), 0)
            const configCount = project.unit_types.length
            return `${totalUnits} Units • ${configCount} Configuration${configCount > 1 ? 's' : ''}`
        }

        // Fallback to old structure if no unit_types
        if (category === 'residential') {
            const res = property.residential || {}
            return `${res.bhk || ''} • ${res.carpet_area || 0} sqft`
        }
        if (category === 'commercial') {
            const comm = property.commercial || {}
            return `${comm.area || 0} sqft • ${comm.ground_floor ? 'Ground Floor' : 'Upper Floor'}`
        }
        if (category === 'land') {
            const land = property.land || {}
            return `${land.plot_area || 0} sqft Plot`
        }
        return ''
    }

    const formatPrice = (price) => {
        if (!price) return '0'
        if (price >= 10000000) return `₹${(price / 10000000).toFixed(2)} Cr`
        if (price >= 100000) return `₹${(price / 100000).toFixed(2)} L`
        return `₹${price.toLocaleString()}`
    }

    return (
        <Card className="hover:shadow-md transition-all duration-300 border-border bg-card group overflow-hidden rounded-xl">
            <div className="relative h-48 bg-muted/30">
                {project.image_url ? (
                    <img
                        src={project.image_url}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted/20">
                        <Building2 className="w-10 h-10 opacity-20" />
                    </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                    <TransactionBadge transaction={re.transaction || 'sell'} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <h3 className="text-white font-medium text-lg leading-tight truncate">{project.name}</h3>
                    <p className="text-white/80 text-xs flex items-center gap-1 truncate mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {location.locality}, {location.city}
                    </p>
                </div>
            </div>

            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1 bg-background rounded-md shadow-sm">
                            <PropertyCategoryIcon category={property.category} />
                        </div>
                        <span className="font-medium capitalize text-xs">{property.category}</span>
                    </div>
                    <div className="font-medium text-foreground text-xs">
                        {getDetailsString()}
                    </div>
                </div>

                {/* Unit Configurations */}
                {project.unit_types && project.unit_types.length > 0 && (
                    <div>
                        <p className="text-[10px] font-medium text-muted-foreground mb-1.5">Configurations</p>
                        <div className="flex flex-wrap gap-1.5">
                            {[...new Set(project.unit_types.map(ut => ut.configuration || ut.property_type))].map((config, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">
                                    {config}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Price Range - prioritize unit_types pricing over real_estate.pricing */}
                {(() => {
                    // Try to get price from unit_types first
                    if (project.unit_types && project.unit_types.length > 0) {
                        const prices = project.unit_types.map(ut => ut.price).filter(p => p > 0)
                        if (prices.length > 0) {
                            const minPrice = Math.min(...prices)
                            const maxPrice = Math.max(...prices)
                            return (
                                <div className="flex items-baseline gap-1 text-foreground">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Range:</span>
                                    <span className="text-base font-semibold">
                                        {formatPrice(minPrice)}
                                    </span>
                                    <span className="text-muted-foreground text-sm">-</span>
                                    <span className="text-base font-semibold">
                                        {formatPrice(maxPrice)}
                                    </span>
                                </div>
                            )
                        }
                    }
                    // Fallback to real_estate.pricing
                    if (pricing.min || pricing.max) {
                        return (
                            <div className="flex items-baseline gap-1 text-foreground">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Range:</span>
                                <span className="text-base font-semibold">
                                    {formatPrice(pricing.min)}
                                </span>
                                <span className="text-muted-foreground text-sm">-</span>
                                <span className="text-base font-semibold">
                                    {formatPrice(pricing.max)}
                                </span>
                            </div>
                        )
                    }
                    return null
                })()}

                <div className="grid grid-cols-2 gap-2 pt-1.5">
                    <Button
                        className="w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        size="sm"
                        onClick={() => onStartCampaign(project)}
                    >
                        <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                        Campaign
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full h-8 text-xs border-border text-foreground hover:bg-muted"
                        size="sm"
                        onClick={() => onView(project)}
                    >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        View
                    </Button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => onEdit(project)}
                        disabled={deleting}
                    >
                        <Edit className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-7 text-xs text-red-500 hover:text-red-700 hover:bg-red-50/50"
                        onClick={() => onDelete(project)}
                        disabled={deleting}
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
