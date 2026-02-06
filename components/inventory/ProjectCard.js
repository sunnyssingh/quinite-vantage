'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, MapPin, TrendingUp, Home, CheckCircle2, Clock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'

export default function ProjectCard({ project }) {
    const router = useRouter()

    const totalUnits = project.total_units || 0
    const soldUnits = project.sold_units || 0
    const reservedUnits = project.reserved_units || 0
    const availableUnits = project.available_units || totalUnits - soldUnits - reservedUnits

    const occupancyRate = totalUnits > 0 ? ((soldUnits + reservedUnits) / totalUnits) * 100 : 0

    const statusConfig = {
        planning: { color: 'bg-blue-100 text-blue-700 border-blue-300', label: '📋 Planning' },
        under_construction: { color: 'bg-amber-100 text-amber-700 border-amber-300', label: '🏗️ Under Construction' },
        ready_to_move: { color: 'bg-green-100 text-green-700 border-green-300', label: '✅ Ready to Move' },
        completed: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: '🎉 Completed' }
    }

    const status = statusConfig[project.project_status] || statusConfig.planning

    const handleClick = () => {
        router.push(`/dashboard/admin/inventory/projects/${project.id}`)
    }

    return (
        <Card
            className="border-border shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
            onClick={handleClick}
        >
            <CardHeader className="pb-3 bg-gradient-to-br from-white to-slate-50 group-hover:from-blue-50 group-hover:to-white transition-colors">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                            {project.name}
                        </CardTitle>
                        {project.address && (
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                {project.address}
                            </p>
                        )}
                    </div>
                    <Badge variant="outline" className={`${status.color} border text-[10px] font-semibold px-2.5 py-1 whitespace-nowrap shadow-sm`}>
                        {status.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Total</p>
                        </div>
                        <p className="text-xl font-bold text-blue-900">{totalUnits}</p>
                    </div>

                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-3 rounded-lg border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <Home className="w-4 h-4 text-emerald-600" />
                            <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">Available</p>
                        </div>
                        <p className="text-xl font-bold text-emerald-900">{availableUnits}</p>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-1.5 mb-1.5">
                            <CheckCircle2 className="w-4 h-4 text-purple-600" />
                            <p className="text-[10px] font-semibold text-purple-700 uppercase tracking-wide">Sold</p>
                        </div>
                        <p className="text-xl font-bold text-purple-900">{soldUnits}</p>
                    </div>
                </div>

                {/* Occupancy Bar */}
                {totalUnits > 0 && (
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Occupancy
                            </span>
                            <span className="text-xs font-bold text-blue-600">{occupancyRate.toFixed(1)}%</span>
                        </div>
                        <Progress value={occupancyRate} className="h-1.5 bg-blue-100" indicatorClassName="bg-blue-600" />
                    </div>
                )}

                {/* Price Range */}
                {project.price_range && (project.price_range.min > 0 || project.price_range.max > 0) && (
                    <div className="pt-3 border-t border-border">
                        <p className="text-[10px] font-medium text-muted-foreground mb-1">Price Range</p>
                        <p className="text-sm font-bold text-foreground">
                            ₹{project.price_range.min?.toLocaleString('en-IN')} - ₹{project.price_range.max?.toLocaleString('en-IN')}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
