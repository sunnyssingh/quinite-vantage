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
        residential: <Home className="w-5 h-5" />,
        commercial: <Store className="w-5 h-5" />,
        land: <LandPlot className="w-5 h-5" />
    }
    return icons[category] || <Building2 className="w-5 h-5" />
}

const TransactionBadge = ({ transaction }) => {
    const colors = {
        sell: 'bg-blue-100 text-blue-800 border-blue-200',
        rent: 'bg-green-100 text-green-800 border-green-200',
        lease: 'bg-purple-100 text-purple-800 border-purple-200',
        pg: 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return (
        <Badge className={`${colors[transaction]} border font-medium`}>
            {transaction?.toUpperCase()}
        </Badge>
    )
}

export default function ProjectCard({ project, onEdit, onDelete, onView, onStartCampaign, deleting }) {
    const re = project.metadata?.real_estate || project.real_estate || {}

    // Safe accessors
    const property = re.property || {}
    const location = re.location || {}
    const pricing = re.pricing || {}
    const media = re.media || {}

    // Determine category-specific details string
    const getDetailsString = () => {
        const category = property.category
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
        <Card className="hover:shadow-lg transition-all duration-200 border-slate-200 group overflow-hidden">
            <div className="relative h-48 bg-slate-100">
                {project.image_url ? (
                    <img
                        src={project.image_url}
                        alt={project.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-50">
                        <Building2 className="w-12 h-12 opacity-20" />
                    </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                    <TransactionBadge transaction={re.transaction || 'sell'} />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <h3 className="text-white font-bold text-lg truncate">{project.name}</h3>
                    <p className="text-white/90 text-sm flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {location.locality}, {location.city}
                    </p>
                </div>
            </div>

            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white rounded-md shadow-sm">
                            <PropertyCategoryIcon category={property.category} />
                        </div>
                        <span className="font-medium capitalize">{property.category}</span>
                    </div>
                    <div className="font-semibold text-slate-900">
                        {getDetailsString()}
                    </div>
                </div>

                <div className="flex items-baseline gap-1 text-slate-900">
                    <span className="text-xs font-semibold text-slate-500 uppercase">Range:</span>
                    <span className="text-lg font-bold text-blue-700">
                        {formatPrice(pricing.min)}
                    </span>
                    <span className="text-slate-400">-</span>
                    <span className="text-lg font-bold text-blue-700">
                        {formatPrice(pricing.max)}
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg"
                        size="sm"
                        onClick={() => onStartCampaign(project)}
                    >
                        <Briefcase className="w-4 h-4 mr-2" />
                        Campaign
                    </Button>
                    <Button
                        variant="outline"
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                        size="sm"
                        onClick={() => onView(project)}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                    </Button>
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => onEdit(project)}
                        disabled={deleting}
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDelete(project)}
                        disabled={deleting}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
