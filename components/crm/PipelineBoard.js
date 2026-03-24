'use client'

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import { useRouter } from 'next/navigation'
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { PipelineColumn } from './PipelineColumn'
import { LeadCard } from './LeadCard'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import LeadForm from './LeadForm'
import { usePermission } from '@/contexts/PermissionContext'

// React Query Hooks
import { useLeads } from '@/hooks/useLeads'
import { usePipelines, useUsers } from '@/hooks/usePipelines'
import { useProjects } from '@/hooks/useProjects'

/**
 * Optimized PipelineBoard with React Query
 * Parallelized fetching and cross-tab caching
 */
const PipelineBoard = forwardRef(({ projectId, campaignId }, ref) => {
    // 1. Parallel Fetching (Hydrates instantly if cached)
    const { data: pipelines = [], isLoading: pipesLoading } = usePipelines()
    const { data: leadsResponse, isLoading: leadsLoading, refetch: refetchLeads } = useLeads({
        projectId: projectId,
        campaign_id: campaignId
    })
    const { data: projectsData } = useProjects({ status: 'active' })
    const { data: users = [] } = useUsers()
    
    // UI Helpers
    const leads = leadsResponse?.leads || []
    const projects = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || [])
    const loading = pipesLoading || leadsLoading
    const activePipeline = pipelines.length > 0 ? pipelines[0] : null
    
    // Local UI interactions
    const [activeDragItem, setActiveDragItem] = useState(null)
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [targetStageId, setTargetStageId] = useState(null)
    const [submitting, setSubmitting] = useState(false)
    const canManageDeals = usePermission('manage_deals')

    const supabase = createClient()
    const router = useRouter()

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Expose refresh function to parent
    useImperativeHandle(ref, () => ({
        refresh: refetchLeads
    }))

    const handleAddLead = (stageId) => {
        setTargetStageId(stageId)
        setAddDialogOpen(true)
    }

    const handleCreateLead = async (formData) => {
        setSubmitting(true)
        try {
            if (!formData.projectId && projectId) formData.projectId = projectId
            
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Failed to create lead')

            toast.success('Lead created successfully')
            refetchLeads() // Sync with server cache
            setAddDialogOpen(false)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDragStart = (event) => {
        if (!canManageDeals) return
        const { active } = event
        setActiveDragItem(active.data.current)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveDragItem(null)
        if (!over) return

        let leadId = active.id
        const overId = over.id

        let newStageId = null
        if (activePipeline?.stages.find(s => s.id === overId)) {
            newStageId = overId
        } else {
            const overLead = leads.find(l => l.id === overId)
            if (overLead) newStageId = overLead.stage_id
        }

        if (newStageId) moveLead(leadId, newStageId)
    }

    const moveLead = useCallback(async (leadId, newStageId) => {
        const leadToUpdate = leads.find(l => l.id === leadId)
        if (!leadToUpdate || leadToUpdate.stage_id === newStageId) return

        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: leadToUpdate.name,
                    stageId: newStageId
                })
            })

            if (!res.ok) throw new Error('Update failed')
            refetchLeads() // Let React Query sync the state
            toast.success('Lead stage updated')
        } catch (error) {
            console.error('Failed to move lead:', error)
            toast.error(`Failed to move lead`)
        }
    }, [leads, refetchLeads])

    const handleLeadClick = (lead) => {
        router.push(`/dashboard/admin/crm/leads/${lead.id}`)
    }

    // [LOADING STATE]
    if (loading && !leads.length) return (
        <div className="flex min-h-[calc(100vh-300px)] gap-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-shrink-0 w-full md:w-[300px] h-full rounded-xl bg-muted/30 border border-border/50 p-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <Skeleton className="h-6 w-32 rounded-md" />
                        <Skeleton className="h-6 w-8 rounded-full" />
                    </div>
                    <div className="space-y-3">
                        <Skeleton className="h-40 w-full rounded-lg bg-card border border-border/50" />
                        <Skeleton className="h-40 w-full rounded-lg bg-card border border-border/50" />
                    </div>
                </div>
            ))}
        </div>
    )

    if (!activePipeline) return (
        <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-xl bg-muted/20">
            <h3 className="text-lg font-medium text-foreground">No Pipelines Found</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md text-center">It looks like you haven't set up a sales pipeline yet.</p>
        </div>
    )

    return (
        <>
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className="flex min-h-[calc(100vh-300px)] gap-4 overflow-x-auto pb-2">
                    {activePipeline.stages.map(stage => {
                        const stageLeads = leads.filter(l => l.stage_id === stage.id || (!l.stage_id && stage.order_index === 0))
                        return (
                            <PipelineColumn
                                key={stage.id}
                                stage={stage}
                                leads={stageLeads.map(l => ({ ...l, onClick: handleLeadClick }))}
                                onAddLead={handleAddLead}
                                canDrop={canManageDeals}
                            />
                        )
                    })}
                </div>
                <DragOverlay>
                    {activeDragItem ? <LeadCard lead={activeDragItem} /> : null}
                </DragOverlay>

                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Quick Add Deal</DialogTitle>
                        </DialogHeader>
                        {targetStageId && (
                            <LeadForm
                                projects={projects}
                                users={users}
                                stages={activePipeline?.stages || []}
                                initialStageId={targetStageId}
                                onSubmit={handleCreateLead}
                                onCancel={() => setAddDialogOpen(false)}
                                isSubmitting={submitting}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </DndContext>
        </>
    )
})

PipelineBoard.displayName = 'PipelineBoard'
export default PipelineBoard
