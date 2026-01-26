import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export default function LeadForm({
    initialData = null,
    projects = [],
    stages = [], // New Prop
    initialStageId = null,
    // initialStatus removed or kept for fallback - let's keep it for fallback
    initialStatus = 'new',
    onSubmit,
    onCancel,
    isSubmitting = false
}) {
    const handleSubmit = (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)

        const payload = {
            id: initialData?.id,
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            projectId: formData.get('projectId') === 'none' ? null : formData.get('projectId'),
            // If we have stages, prioritize stageId. Otherwise use status.
            stageId: formData.get('stageId') || initialStageId || initialData?.stage_id,
            status: formData.get('status'), // This might be hidden or derived
            notes: formData.get('notes')
        }

        onSubmit(payload)
    }

    const [fetchedStages, setFetchedStages] = useState(stages)
    const [loadingStages, setLoadingStages] = useState(false)

    const [selectedStageId, setSelectedStageId] = useState(initialStageId || initialData?.stage_id || '')

    // Fetch stages when project changes
    const fetchStages = async (pid) => {
        setLoadingStages(true)
        try {
            // Retrieve stages for specific project or all organization stages if none selected
            const url = (!pid || pid === 'none')
                ? '/api/pipeline/stages'
                : `/api/pipeline/stages?projectId=${pid}`

            const res = await fetch(url)
            if (res.ok) {
                const data = await res.json()
                const newStages = data.stages || []
                setFetchedStages(newStages)

                // Auto-select first stage if none selected or current selection is invalid
                // But preserve existing selection if it exists in new list
                if (newStages.length > 0) {
                    // Check if current selection is in the new list
                    const currentExists = newStages.find(s => s.id === selectedStageId)
                    if (!currentExists && !initialData?.stage_id) {
                        setSelectedStageId(newStages[0].id)
                    }
                }
            }
        } catch (e) {
            console.error('Failed to fetch stages', e)
            setFetchedStages([])
        } finally {
            setLoadingStages(false)
        }
    }

    // Initial fetch if no stages provided
    React.useEffect(() => {
        if (stages.length === 0) {
            fetchStages(initialData?.project_id || 'none')
        } else {
            // If stages provided via props, ensure one is selected
            if (!selectedStageId && stages.length > 0) {
                setSelectedStageId(stages[0].id)
            }
        }
    }, [])

    const handleProjectChange = (val) => {
        fetchStages(val)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" defaultValue={initialData?.name} required />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input name="email" type="email" defaultValue={initialData?.email} />
                </div>
                <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input name="phone" defaultValue={initialData?.phone} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Project</Label>
                    <Select
                        name="projectId"
                        defaultValue={initialData?.project_id || 'none'}
                        onValueChange={handleProjectChange}
                    >
                        <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {fetchedStages.length > 0 || loadingStages ? (
                    <div className="space-y-2">
                        <Label>Pipeline Stage</Label>
                        <Select
                            name="stageId"
                            value={selectedStageId}
                            onValueChange={setSelectedStageId}
                            disabled={loadingStages}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={loadingStages ? "Loading..." : "Select stage"} />
                            </SelectTrigger>
                            <SelectContent>
                                {fetchedStages.map(stage => (
                                    <SelectItem key={stage.id} value={stage.id}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                                            {stage.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Hidden status field for backward compatibility/API requirement if needed */}
                        <input type="hidden" name="status" value="new" />
                    </div>
                ) : (
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select name="status" defaultValue={initialStatus || initialData?.status || 'new'}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="qualified">Qualified</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="lost">Lost</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={initialData?.notes} rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {initialData ? 'Update Lead' : 'Create Lead'}
                </Button>
            </div>
        </form>
    )
}
