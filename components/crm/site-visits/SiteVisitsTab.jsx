'use client'

import { useState, useMemo } from 'react'
import { Plus, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSiteVisits, useUpdateSiteVisit, useDeleteSiteVisit } from '@/hooks/useSiteVisits'
import { useUsers, usePipelines } from '@/hooks/usePipelines'
import { isSiteVisitDoneStage } from '@/lib/site-visit-stages'
import SiteVisitCard from './SiteVisitCard'
import BookSiteVisitDialog from './BookSiteVisitDialog'
import SiteVisitOutcomeDialog from './SiteVisitOutcomeDialog'
import { toast } from 'react-hot-toast'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Calendar, CheckCircle2, XCircle } from 'lucide-react'

export default function SiteVisitsTab({ leadId, lead }) {
    const { data: visits = [], isLoading } = useSiteVisits(leadId)
    const { data: users = [] } = useUsers()
    const { data: pipelines = [] } = usePipelines()
    const updateMutation = useUpdateSiteVisit(leadId)
    const deleteMutation = useDeleteSiteVisit(leadId)

    const [bookOpen, setBookOpen] = useState(false)
    const [editingVisit, setEditingVisit] = useState(null)
    const [outcomeVisit, setOutcomeVisit] = useState(null)

    const siteVisitDoneStage = useMemo(() => {
        const stages = pipelines[0]?.stages || []
        return stages.find(s => isSiteVisitDoneStage(s.name)) ?? null
    }, [pipelines])

    const handleDelete = async (visit) => {
        if (!confirm('Delete this site visit?')) return
        try {
            await deleteMutation.mutateAsync(visit.id)
            toast.success('Site visit deleted')
        } catch {
            toast.error('Failed to delete')
        }
    }

    const handleMarkNoShow = async (visit) => {
        try {
            await updateMutation.mutateAsync({ visitId: visit.id, status: 'no_show' })
            toast.success('Marked as no show')
        } catch {
            toast.error('Failed to update')
        }
    }

    const handleOutcomeSuccess = async () => {
        if (!siteVisitDoneStage || !lead) return
        if (lead.stage_id === siteVisitDoneStage.id) return
        try {
            await fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stageId: siteVisitDoneStage.id }),
            })
            toast.success('Stage moved to Site Visit Done')
        } catch {
            // non-critical — visit was already saved
        }
    }

    const upcoming = visits
        .filter(v => v.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at))
    const past = visits
        .filter(v => v.status !== 'scheduled')
        .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at))

    const statsData = {
        total: visits.length,
        upcoming: upcoming.length,
        completed: visits.filter(v => v.status === 'completed').length,
        noShow: visits.filter(v => v.status === 'no_show').length,
    }

    return (
        <div className="space-y-6 w-full">
            {/* Header Analytics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Visits', value: statsData.total, icon: MapPin, color: 'blue' },
                    { label: 'Upcoming', value: statsData.upcoming, icon: Calendar, color: 'emerald' },
                    { label: 'Completed', value: statsData.completed, icon: CheckCircle2, color: 'indigo' },
                    { label: 'No Show', value: statsData.noShow, icon: XCircle, color: 'red' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="border-0 shadow-sm ring-1 ring-gray-100 bg-white">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className={cn("p-2.5 rounded-xl", 
                                color === 'blue' ? 'bg-blue-50 text-blue-600' : 
                                color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 
                                color === 'indigo' ? 'bg-indigo-50 text-indigo-600' :
                                'bg-red-50 text-red-600'
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">{label}</p>
                                <p className={cn(
                                    "text-base font-black mt-0.5",
                                    label === 'No Show' && value > 0 ? 'text-red-600' : 'text-gray-900'
                                )}>{value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Header Actions */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl shadow-sm ring-1 ring-slate-100">
                <div className="px-2">
                    <h3 className="text-sm font-semibold text-slate-900">Site Visits</h3>
                </div>
                <Button size="sm" onClick={() => { setEditingVisit(null); setBookOpen(true) }} className="h-9 gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-4 font-bold shadow-md active:scale-95 transition-all text-xs shrink-0">
                    <Plus className="w-3.5 h-3.5" />
                    Book Visit
                </Button>
            </div>

            {isLoading && (
                <div className="space-y-3">
                    {[1,2].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
                </div>
            )}

            {!isLoading && visits.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                        <MapPin className="w-6 h-6 text-primary" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No site visits yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Book a site visit to schedule a meeting at the property</p>
                    <Button size="sm" variant="outline" className="mt-4 gap-1.5" onClick={() => setBookOpen(true)}>
                        <Plus className="w-3.5 h-3.5" />
                        Book First Visit
                    </Button>
                </div>
            )}

            {upcoming.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming</p>
                    {upcoming.map(v => (
                        <SiteVisitCard
                            key={v.id}
                            visit={v}
                            onEdit={(visit) => { setEditingVisit(visit); setBookOpen(true) }}
                            onDelete={handleDelete}
                            onMarkComplete={(visit) => setOutcomeVisit(visit)}
                            onMarkNoShow={handleMarkNoShow}
                        />
                    ))}
                </div>
            )}

            {past.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past</p>
                    {past.map(v => (
                        <SiteVisitCard
                            key={v.id}
                            visit={v}
                            onEdit={(visit) => { setEditingVisit(visit); setBookOpen(true) }}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            <BookSiteVisitDialog
                open={bookOpen}
                onOpenChange={setBookOpen}
                leadId={leadId}
                lead={lead}
                visit={editingVisit}
                agents={users}
                defaultAgentId={lead?.assigned_to}
            />

            <SiteVisitOutcomeDialog
                open={!!outcomeVisit}
                onOpenChange={(o) => !o && setOutcomeVisit(null)}
                leadId={leadId}
                visit={outcomeVisit}
                onSuccess={handleOutcomeSuccess}
            />
        </div>
    )
}
