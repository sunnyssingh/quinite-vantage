import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Building2, Home, Wallet, TrendingUp, Users, Percent, ShieldAlert, CheckCircle2, Clock } from "lucide-react"
import { formatINR } from "@/lib/inventory"

export function AnalyticsView({ properties = [], projects = [] }) {
    const totalUnits = properties.length
    const availableUnits = properties.filter(p => p.status === 'available').length
    const soldUnits = properties.filter(p => p.status === 'sold').length
    const reservedUnits = properties.filter(p => p.status === 'reserved').length
    const blockedUnits = properties.filter(p => p.status === 'blocked' || p.status === 'under_maintenance').length

    const totalValue = properties.reduce((acc, curr) => acc + (curr.price || 0), 0)

    const byType = properties.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1
        return acc
    }, {})

    const stats = [
        {
            title: "Inventory Value",
            value: formatINR(totalValue),
            description: "Total value of all properties",
            icon: Wallet,
            className: "from-blue-600 to-indigo-700"
        },
        {
            title: "Total Units",
            value: totalUnits,
            description: `${availableUnits} Available for Sale`,
            icon: Building2,
            className: "from-purple-600 to-fuchsia-700"
        },
        {
            title: "Sold & Reserved",
            value: soldUnits + reservedUnits,
            description: `${soldUnits} Confirmed Sales`,
            icon: CheckCircle2,
            className: "from-green-600 to-emerald-700"
        },
        {
            title: "Sales Velocity",
            value: totalUnits ? `${Math.round(((soldUnits + reservedUnits) / totalUnits) * 100)}%` : "0%",
            description: "Inventory conversion rate",
            icon: TrendingUp,
            className: "from-amber-500 to-orange-600"
        }
    ]

    return (
        <div className="space-y-6 p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <Card key={i} className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group relative">
                            <CardContent className="p-0">
                                <div className={`p-6 bg-gradient-to-br ${stat.className} text-white`}>
                                    <div className="flex items-center justify-between relative z-10">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">
                                                {stat.title}
                                            </p>
                                            <div className="text-3xl font-black mb-1 flex items-baseline gap-1">
                                                {stat.value}
                                            </div>
                                            <p className="text-[10px] text-white/60 font-medium">
                                                {stat.description}
                                            </p>
                                        </div>
                                        <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
                                            <Icon className="h-6 w-6" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-slate-200 shadow-md hover:shadow-lg transition-shadow bg-card">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Project Performance Breakdown
                        </CardTitle>
                        <CardDescription>Comprehensive metrics across active projects</CardDescription>
                    </CardHeader>
                    <CardContent className="px-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-y bg-slate-50/50 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                                        <th className="px-6 py-3 text-left">Project Name</th>
                                        <th className="px-4 py-3 text-center">Total Units</th>
                                        <th className="px-4 py-3 text-center">Available</th>
                                        <th className="px-4 py-3 text-center">Sold/Res.</th>
                                        <th className="px-6 py-3 text-right">Sales Progress</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {projects.length === 0 ? (
                                        <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No project data available</td></tr>
                                    ) : (
                                        projects.sort((a,b) => (b.total_units || 0) - (a.total_units || 0)).map(project => {
                                            const projectProps = properties.filter(p => p.project_id === project.id)
                                            const confirmed = projectProps.filter(p => p.status === 'sold' || p.status === 'reserved').length
                                            const avail = projectProps.filter(p => p.status === 'available').length
                                            const progress = project.total_units ? Math.round((confirmed / project.total_units) * 100) : 0
                                            
                                            return (
                                                <tr key={project.id} className="hover:bg-slate-50 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-700">
                                                                {project.name.substring(0, 2).toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-slate-700 truncate max-w-[150px]">{project.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 text-center font-bold text-slate-600">{project.total_units || 0}</td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black">{avail}</span>
                                                    </td>
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black">{confirmed}</span>
                                                    </td>
                                                    <td className="px-6 py-4 w-[200px]">
                                                        <div className="space-y-1.5 text-right">
                                                            <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-500">
                                                                <span>{confirmed} / {project.total_units || 0}</span>
                                                                <span className="text-blue-600">{progress}%</span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div 
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full group-hover:scale-x-105 transition-transform origin-left duration-500" 
                                                                    style={{ width: `${progress}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-slate-200 shadow-md bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Inventory Status Pulse</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { label: 'Available', count: availableUnits, color: 'bg-emerald-500', pct: totalUnits ? availableUnits/totalUnits*100 : 0 },
                                { label: 'Sold', count: soldUnits, color: 'bg-slate-500', pct: totalUnits ? soldUnits/totalUnits*100 : 0 },
                                { label: 'Reserved', count: reservedUnits, color: 'bg-amber-500', pct: totalUnits ? reservedUnits/totalUnits*100 : 0 },
                                { label: 'Blocked / Maint.', count: blockedUnits, color: 'bg-red-500', pct: totalUnits ? blockedUnits/totalUnits*100 : 0 },
                            ].map(status => (
                                <div key={status.label} className="space-y-1.5">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-slate-500 flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                            {status.label}
                                        </span>
                                        <span className="text-slate-900">{status.count} <span className="text-slate-300 ml-1">({Math.round(status.pct)}%)</span></span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${status.color} transition-all duration-700 ease-out`} style={{ width: `${status.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-md bg-card">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Distribution by Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(byType).map(([type, count]) => (
                                    <div key={type} className="bg-slate-50 p-3 rounded-xl border border-slate-100 group hover:border-blue-200 transition-colors">
                                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{type.replace('_', ' ')}</span>
                                        <span className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tighter">{count}</span>
                                        <div className="text-[9px] text-slate-500 font-medium">properties</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
