import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Home, Wallet, TrendingUp, Users, Percent } from "lucide-react"

export function AnalyticsView({ properties = [], projects = [] }) {
    // Calculate stats from ACTUAL properties, not total_units field
    const totalUnits = properties.length

    // Calculate available and sold from properties
    const availableUnits = properties.filter(p => p.status === 'available').length
    const soldUnits = properties.filter(p => p.status === 'sold').length
    const reservedUnits = properties.filter(p => p.status === 'reserved').length

    // Calculate total value from properties
    const totalValue = properties.reduce((acc, curr) => acc + (curr.price || 0), 0)

    // Group by type
    const byType = properties.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1
        return acc
    }, {})

    // Stats cards configuration
    const stats = [
        {
            title: "Total Inventory Value",
            value: `₹${(totalValue / 10000000).toFixed(2)} Cr`,
            description: "Total value of all listed properties",
            icon: Wallet,
            className: "text-blue-600 bg-blue-50"
        },
        {
            title: "Total Properties",
            value: totalUnits,
            description: `${availableUnits} Available, ${soldUnits} Sold`,
            icon: Building2,
            className: "text-purple-600 bg-purple-50"
        },
        {
            title: "Active Projects",
            value: projects.length,
            description: "Projects currently in inventory",
            icon: Home,
            className: "text-green-600 bg-green-50"
        },
        {
            title: "Occupancy Rate",
            value: totalUnits ? `${Math.round((soldUnits / totalUnits) * 100)}%` : "0%",
            description: "Percentage of inventory sold",
            icon: Percent,
            className: "text-amber-600 bg-amber-50"
        }
    ]

    return (
        <div className="space-y-6 p-6 animate-in fade-in duration-500">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <Card key={i} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                            <CardContent className="p-0">
                                {/* Gradient Background */}
                                <div className={`p-6 bg-gradient-to-br ${i === 0 ? 'from-blue-500 to-blue-600' :
                                    i === 1 ? 'from-purple-500 to-purple-600' :
                                        i === 2 ? 'from-green-500 to-green-600' :
                                            'from-amber-500 to-amber-600'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="text-xs font-medium text-white/80 uppercase tracking-wider mb-1">
                                                {stat.title}
                                            </p>
                                            <div className="text-3xl font-bold text-white mb-1 group-hover:scale-105 transition-transform">
                                                {stat.value}
                                            </div>
                                            <p className="text-xs text-white/70 mt-1">
                                                {stat.description}
                                            </p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Types Distribution */}
                <Card className="col-span-1 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                            Inventory Distribution
                        </CardTitle>
                        <CardDescription>Breakdown by property type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(byType).length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                            ) : (
                                Object.entries(byType).map(([type, count], idx) => {
                                    const percentage = properties.length ? (count / properties.length) * 100 : 0
                                    const colors = [
                                        'bg-blue-500',
                                        'bg-purple-500',
                                        'bg-green-500',
                                        'bg-amber-500',
                                        'bg-pink-500'
                                    ]
                                    const bgColors = [
                                        'bg-blue-100',
                                        'bg-purple-100',
                                        'bg-green-100',
                                        'bg-amber-100',
                                        'bg-pink-100'
                                    ]
                                    return (
                                        <div key={type} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                                                    <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</span>
                                                    <span className="text-sm font-semibold min-w-[3ch]">{count}</span>
                                                </div>
                                            </div>
                                            <div className={`w-full h-2.5 ${bgColors[idx % bgColors.length]} rounded-full overflow-hidden`}>
                                                <div
                                                    className={`h-full ${colors[idx % colors.length]} rounded-full transition-all duration-500`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Project Performance */}
                <Card className="col-span-1 border-slate-200 shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                            </div>
                            Top Projects
                        </CardTitle>
                        <CardDescription>By inventory volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No projects found</p>
                            ) : (
                                projects
                                    .sort((a, b) => (b.total_units || 0) - (a.total_units || 0))
                                    .slice(0, 5)
                                    .map(project => {
                                        const projectProperties = properties.filter(p => p.project_id === project.id)
                                        const soldCount = projectProperties.filter(p => p.status === 'sold').length
                                        const totalUnits = project.total_units || 0
                                        const soldPercentage = totalUnits ? (soldCount / totalUnits) * 100 : 0

                                        return (
                                            <div key={project.id} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-sm font-bold text-white shadow-md">
                                                            {project.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold truncate">{project.name}</p>
                                                            <p className="text-xs text-muted-foreground truncate">{project.address || 'No address'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right ml-2">
                                                        <div className="text-sm font-bold text-foreground">{totalUnits}</div>
                                                        <div className="text-xs text-muted-foreground">units</div>
                                                    </div>
                                                </div>
                                                {/* Progress bar */}
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-muted-foreground">{soldCount} sold</span>
                                                        <span className="text-muted-foreground">{soldPercentage.toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
                                                            style={{ width: `${soldPercentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
