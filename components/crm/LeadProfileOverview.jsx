'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building, Plus, X, Home, MapPin } from 'lucide-react'

import UnitDealsCard from './UnitDealsCard'
import ComingUpNextCard from './ComingUpNextCard'
import BestTimeToContactCard from './BestTimeToContactCard'
import SentimentAnalysisCard from './SentimentAnalysisCard'
import ClientPreferencesCard from './ClientPreferencesCard'

export default function LeadProfileOverview({
    lead,
    profile,
    organization,
    onUpdate,
    onLinkUnit,
    onUnlinkUnit
}) {
    const leadId = lead.id

    const projects = useMemo(() => {
        return Array.isArray(lead.projects)
            ? lead.projects
            : (lead.projects ? [lead.projects] : (lead.project ? [lead.project] : []))
    }, [lead.projects, lead.project])

    const linkedItems = useMemo(() => {
        const otherProjects = projects.filter(p => !lead.unit?.project_id || p.id !== lead.unit.project_id)
        return (lead.unit ? [lead.unit] : []).concat(otherProjects)
    }, [projects, lead.unit])

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-12 gap-6">
                {/* Units Card */}
                <div className="col-span-12 md:col-span-4">
                    <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                    <Building className="w-4 h-4" />
                                </div>
                                <CardTitle className="text-sm font-semibold text-gray-900">Units</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium">
                                    {linkedItems.length}
                                </Badge>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-full"
                                    onClick={onLinkUnit}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {linkedItems.length > 0 ? (
                                <div className="max-h-[350px] overflow-y-auto pr-1 space-y-4 custom-scrollbar">
                                    {/* Display Linked Unit first */}
                                    {lead.unit && (
                                        <div className="group relative flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">

                                            {/* Unlink Button */}
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onUnlinkUnit()
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>

                                            <div className="h-14 w-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200 flex items-center justify-center">
                                                <Home className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <div className="flex-1 min-w-0 py-0.5">
                                                <div className="flex justify-between items-start gap-2 pr-6">
                                                    <h4 className="font-semibold text-sm text-slate-900 leading-tight truncate">
                                                        {lead.unit.unit_number} {lead.unit.title ? `- ${lead.unit.title}` : ''}
                                                    </h4>
                                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-50 text-emerald-700 border-emerald-200">
                                                        Unit
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                                                    {lead.unit.project?.name && (
                                                        <span className="font-medium text-slate-700">{lead.unit.project.name}</span>
                                                    )}
                                                </div>
                                                {(lead.unit.total_price || lead.unit.base_price || lead.unit.price) && (
                                                    <p className="text-xs font-semibold text-slate-900 mt-1">
                                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: organization?.currency || 'INR', maximumFractionDigits: 0 }).format(lead.unit.total_price || lead.unit.base_price || lead.unit.price)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Display Linked Projects (excluding the one linked via Property Unit) */}
                                    {projects
                                        .filter(p => !lead.unit?.project_id || p.id !== lead.unit.project_id)
                                        .map((project, index) => (
                                            <div key={index} className="group relative flex items-start gap-3 p-2 rounded-xl border border-transparent hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">

                                                {/* Unlink Button */}
                                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            onUnlinkUnit()
                                                        }}
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </Button>
                                                </div>

                                                {/* Small Thumbnail */}
                                                <div className="h-14 w-20 shrink-0 bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                                                    {project.image_url ? (
                                                        <img
                                                            src={project.image_url}
                                                            alt={project.name}
                                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                            onError={(e) => e.target.style.display = 'none'}
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full text-slate-400">
                                                            <Building className="w-5 h-5 opacity-40" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0 py-0.5">
                                                    <div className="flex justify-between items-start gap-2 pr-6">
                                                        <h4 className="font-semibold text-sm text-slate-900 leading-tight truncate">{project.name}</h4>
                                                        {project.metadata?.real_estate?.property?.category && (
                                                            <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-full capitalize">
                                                                {project.metadata.real_estate.property.category}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {project.address && (
                                                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                                                            <MapPin className="w-3 h-3 shrink-0 opacity-70" />
                                                            <span className="truncate">{project.address}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="py-12 text-center flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-gray-50/50">
                                    <Building className="w-8 h-8 mb-2 opacity-20" />
                                    <p className="text-sm">No units linked</p>
                                    <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-primary" onClick={onLinkUnit}>Link Unit</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Client Preferences - Spans 8 cols */}
                <div className="col-span-12 md:col-span-8">
                    <ClientPreferencesCard
                        profile={profile}
                        leadId={leadId}
                        onUpdate={onUpdate}
                        currency={organization?.currency || 'USD'}
                    />
                </div>
            </div>

            {/* Secondary Row */}
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4">
                    <UnitDealsCard
                        deals={lead.deals || []}
                        leadId={leadId}
                        onUpdate={onUpdate}
                        currency={organization?.currency || 'INR'}
                        defaultUnit={lead.unit}
                        defaultProject={lead.projects?.[0] || lead.project}
                    />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <ComingUpNextCard leadId={leadId} />
                </div>
                <div className="col-span-12 md:col-span-4">
                    <BestTimeToContactCard
                        profile={profile}
                        leadId={leadId}
                        onUpdate={onUpdate}
                    />
                </div>
            </div>

            {/* Sentiment */}
            <div>
                <SentimentAnalysisCard callLogs={lead.call_logs || []} />
            </div>
        </div>
    )
}
