'use client'

import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'
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
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import LeadForm from './LeadForm'

const PipelineBoard = forwardRef(({ projectId }, ref) => {
    const [pipelines, setPipelines] = useState([])
    const [activePipeline, setActivePipeline] = useState(null)
    const [leads, setLeads] = useState([])
    const [activeDragItem, setActiveDragItem] = useState(null)
    const [loading, setLoading] = useState(true)
    const [projects, setProjects] = useState([]) // To pass to LeadForm

    // Add Deal State
    const [addDialogOpen, setAddDialogOpen] = useState(false)
    const [targetStageId, setTargetStageId] = useState(null)
    const [submitting, setSubmitting] = useState(false)

    const supabase = createClient()

    // Sensors for drag detection
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    // Define fetchData first so it can be used in hooks below
    const fetchData = useCallback(async () => {
        console.log('🔄 [PipelineBoard] fetchData called, projectId:', projectId)
        try {
            setLoading(true)
            // 1. Fetch Pipelines
            const pipeRes = await fetch('/api/crm/pipelines')
            const pipeData = await pipeRes.json()

            if (pipeData.pipelines?.length > 0) {
                setPipelines(pipeData.pipelines)
                setActivePipeline(pipeData.pipelines[0])
            }

            // 2. Fetch Leads
            const params = new URLSearchParams()
            if (projectId) params.append('project_id', projectId)

            const leadsRes = await fetch(`/api/leads?${params.toString()}`)
            const leadsData = await leadsRes.json()
            console.log('📋 [PipelineBoard] Fetched leads:', leadsData.leads?.length, 'leads')
            console.log('🔍 [PipelineBoard] Lead stages:', leadsData.leads?.map(l => ({ name: l.name, stage_id: l.stage_id, stage: l.stage?.name })))
            setLeads(leadsData.leads || [])

            // 3. Fetch Projects (for the form dropdown)
            const projRes = await fetch('/api/projects')
            const projData = await projRes.json()
            setProjects(projData.projects || [])

        } catch (error) {
            console.error('Failed to fetch CRM data:', error)
            toast.error('Failed to load CRM data')
        } finally {
            setLoading(false)
        }
    }, [projectId])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // Expose refresh function to parent
    useImperativeHandle(ref, () => ({
        refresh: fetchData
    }))

    const handleAddLead = (stageId) => {
        setTargetStageId(stageId)
        setAddDialogOpen(true)
    }

    const handleCreateLead = async (formData) => {
        setSubmitting(true)
        try {
            // If projectId wasn't manually selected but we are in a project context, use that
            if (!formData.projectId && projectId) {
                formData.projectId = projectId
            }

            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Failed to create lead')

            toast.success('Lead created successfully')

            // Optimistically add to UI
            setLeads(prev => [result.lead, ...prev])
            setAddDialogOpen(false)
        } catch (error) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDragStart = (event) => {
        const { active } = event
        setActiveDragItem(active.data.current)
    }

    const handleDragEnd = async (event) => {
        const { active, over } = event
        setActiveDragItem(null)

        if (!over) return

        const leadId = active.id
        const overId = over.id // Could be a stage ID or another lead ID

        // Find the stage we dropped onto
        let newStageId = null

        // Case 1: Dropped directly on a column (Stage)
        if (activePipeline?.stages.find(s => s.id === overId)) {
            newStageId = overId
        }
        // Case 2: Dropped on another lead (find that lead's stage)
        else {
            const overLead = leads.find(l => l.id === overId)
            if (overLead) {
                newStageId = overLead.stage_id
            }
        }

        // Attempt Move
        if (newStageId) {
            moveLead(leadId, newStageId)
        }
    }

    const moveLead = useCallback(async (leadId, newStageId) => {
        // 1. Optimistic Update
        const originalLeads = [...leads]
        const leadToUpdate = leads.find(l => l.id === leadId)

        if (!leadToUpdate || leadToUpdate.stage_id === newStageId) return

        setLeads(prev => prev.map(l =>
            l.id === leadId ? { ...l, stage_id: newStageId } : l
        ))

        // 2. API Call
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: leadToUpdate.name, // Required by PUT validation
                    stageId: newStageId
                })
            })

            if (!res.ok) throw new Error('Update failed')

        } catch (error) {
            // Revert on failure
            setLeads(originalLeads)
            toast.error('Failed to move lead')
        }
    }, [leads])

    const handleSeed = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/crm/seed', { method: 'POST' })
            if (!res.ok) throw new Error('Failed to create pipeline')
            toast.success('Default pipeline created!')
            fetchData() // Refresh
        } catch (error) {
            toast.error('Failed to setup pipeline')
            setLoading(false)
        }
    }

    if (loading) return <div className="h-full flex items-center justify-center"><LoadingSpinner /></div>

    if (!activePipeline) {
        return (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <h3 className="text-lg font-semibold text-slate-700">No Pipelines Found</h3>
                <p className="text-slate-500 mb-6 max-w-md text-center">It looks like you haven't set up a sales pipeline yet. Create a default one to get started with your CRM.</p>

                <div className="flex gap-4">
                    <button
                        onClick={handleSeed}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm flex items-center gap-2"
                    >
                        Setup Default Pipeline
                    </button>
                </div>
            </div>
        )
    }

    // Filter leads to match current pipeline stages only
    // If a lead has no stage_id, we might put it in the first stage or an 'Unassigned' bucket.
    // For now, let's assume we put unassigned leads in the first stage if not set.

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-2">
                {activePipeline.stages.map(stage => {
                    const stageLeads = leads.filter(l =>
                        l.stage_id === stage.id ||
                        (!l.stage_id && stage.order_index === 0) // Default to first stage
                    )

                    console.log(`📊 [PipelineBoard] Stage "${stage.name}" (${stage.id}):`, stageLeads.length, 'leads')


                    return (
                        <PipelineColumn
                            key={stage.id}
                            stage={stage}
                            leads={stageLeads}
                            onAddLead={handleAddLead}
                        />
                    )
                })}
            </div>

            <DragOverlay>
                {activeDragItem ? <LeadCard lead={activeDragItem} /> : null}
            </DragOverlay>

            {/* Quick Add Lead Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Quick Add Deal</DialogTitle>
                        <DialogDescription>
                            Create a new lead directly in this stage.
                        </DialogDescription>
                    </DialogHeader>
                    {targetStageId && (
                        <LeadForm
                            projects={projects}
                            stages={activePipeline?.stages || []} // Pass stages
                            initialStageId={targetStageId}
                            // Initial status is fallback
                            initialStatus={(() => {
                                const stage = activePipeline?.stages.find(s => s.id === targetStageId)
                                if (!stage) return 'new'
                                const name = stage.name.toLowerCase()
                                if (name.includes('contact')) return 'contacted'
                                if (name.includes('qualif')) return 'qualified'
                                if (name.includes('negotiat')) return 'contacted'
                                if (name.includes('won') || name.includes('convert')) return 'converted'
                                if (name.includes('lost')) return 'lost'
                                return 'new'
                            })()}
                            onSubmit={handleCreateLead}
                            onCancel={() => setAddDialogOpen(false)}
                            isSubmitting={submitting}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </DndContext>
    )
})

PipelineBoard.displayName = 'PipelineBoard'

export default PipelineBoard
