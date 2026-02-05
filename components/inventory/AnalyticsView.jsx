import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Home, Wallet, TrendingUp, Users, Percent } from "lucide-react"

export function AnalyticsView({ properties = [], projects = [] }) {
    // Calculate stats
    const totalProperties = properties.length
    const totalValue = properties.reduce((acc, curr) => acc + (curr.price || 0), 0)
    const availableProperties = properties.filter(p => p.status === 'available').length
    const soldProperties = properties.filter(p => p.status === 'sold').length

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
            value: totalProperties,
            description: `${availableProperties} Available, ${soldProperties} Sold`,
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
            value: totalProperties ? `${Math.round((soldProperties / totalProperties) * 100)}%` : "0%",
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
                        <Card key={i} className="border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between space-y-0 pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </p>
                                    <div className={`p-2 rounded-full ${stat.className}`}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="flex flex-col mt-3">
                                    <div className="text-2xl font-bold">{stat.value}</div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {stat.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Property Types Distribution */}
                <Card className="col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-slate-500" />
                            Inventory Distribution
                        </CardTitle>
                        <CardDescription>Breakdown by property type</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(byType).length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
                            ) : (
                                Object.entries(byType).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                                            <span className="text-sm font-medium capitalize">{type.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 rounded-full"
                                                    style={{ width: `${(count / totalProperties) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm text-muted-foreground min-w-[3ch]">{count}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Project Performance */}
                <Card className="col-span-1 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-slate-500" />
                            Top Projects
                        </CardTitle>
                        <CardDescription>By inventory volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {projects.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-8">No projects found</p>
                            ) : (
                                projects.slice(0, 5).map(project => {
                                    const count = properties.filter(p => p.project_id === project.id).length
                                    return (
                                        <div key={project.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                                    {project.name.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{project.name}</p>
                                                    <p className="text-xs text-muted-foreground">{project.address || 'No address'}</p>
                                                </div>
                                            </div>
                                            <div className="text-sm font-medium">
                                                {count} Props
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
