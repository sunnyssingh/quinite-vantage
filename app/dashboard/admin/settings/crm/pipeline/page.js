'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { GripVertical, Trash2, Plus, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function SortableStage({ id, stage, onChange, onDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-3 bg-white border rounded-lg mb-2 shadow-sm group">
            <div {...attributes} {...listeners} className="cursor-grab hover:text-blue-600 outline-none">
                <GripVertical className="h-5 w-5 text-gray-400" />
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    value={stage.name}
                    onChange={(e) => onChange(id, 'name', e.target.value)}
                    placeholder="Stage Name"
                    className="h-9"
                />
                <div className="flex gap-2">
                    <div className="relative w-full">
                        <div className="absolute left-2 top-2.5 h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: stage.color }}></div>
                        <Input
                            value={stage.color}
                            onChange={(e) => onChange(id, 'color', e.target.value)}
                            placeholder="#Color"
                            className="h-9 pl-8 font-mono"
                        />
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

export default function PipelineSettingsPage() {
    const [pipelines, setPipelines] = useState([])
    const [selectedPipelineId, setSelectedPipelineId] = useState(null)
    const [stages, setStages] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Sensors for Drag and Drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    useEffect(() => {
        fetchPipelines()
    }, [])

    useEffect(() => {
        if (selectedPipelineId && pipelines.length > 0) {
            const pipeline = pipelines.find(p => p.id === selectedPipelineId)
            if (pipeline) {
                setStages(pipeline.stages || [])
            }
        }
    }, [selectedPipelineId, pipelines])

    const fetchPipelines = async () => {
        try {
            const res = await fetch('/api/crm/pipelines')
            const data = await res.json()
            if (data.pipelines) {
                setPipelines(data.pipelines)
                if (data.pipelines.length > 0 && !selectedPipelineId) {
                    setSelectedPipelineId(data.pipelines[0].id)
                }
            }
        } catch (error) {
            console.error('Failed to fetch pipelines:', error)
            toast.error('Failed to load pipelines')
        } finally {
            setLoading(false)
        }
    }

    const handleDragEnd = (event) => {
        const { active, over } = event

        if (active.id !== over.id) {
            setStages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
    }

    const handleStageChange = (id, field, value) => {
        setStages(prev => prev.map(stage =>
            stage.id === id ? { ...stage, [field]: value } : stage
        ))
    }

    const handleDeleteStage = async (id) => {
        // If it's a new temporary stage (no backend ID yet, usually UUID check or negative ID), just remove from state
        // But here we rely on backend having generated IDs or temp IDs. 
        // For simplicity, let's assume we optimistically remove from UI and delete from API if it exists.

        // However, if we delete, we should probably confirm. 
        if (!confirm('Are you sure? This will remove the stage permanently.')) return

        if (String(id).startsWith('temp-')) {
            setStages(prev => prev.filter(s => s.id !== id))
            return
        }

        try {
            const res = await fetch(`/api/pipeline/stages/${id}`, { method: 'DELETE' })
            const data = await res.json()
            if (res.ok) {
                setStages(prev => prev.filter(s => s.id !== id))
                toast.success('Stage deleted')
            } else {
                toast.error(data.error || 'Failed to delete stage')
            }
        } catch (error) {
            toast.error('Error deleting stage')
        }
    }

    const handleAddStage = () => {
        const newStage = {
            id: `temp-${Date.now()}`,
            name: 'New Stage',
            color: '#cbd5e1',
            order_index: stages.length,
            pipeline_id: selectedPipelineId
        }
        setStages([...stages, newStage])
    }

    const handleSave = async () => {
        if (!selectedPipelineId) return
        setSaving(true)

        try {
            // Prepare payload
            // For new stages (temp-id), we need to POST them first or let PUT handle them if we modify API?
            // Existing API: 
            // PUT expects list of updates. 
            // POST creates one.

            // Strategy: 
            // 1. Filter new stages (temp-) -> Create them via POST
            // 2. Filter existing stages -> Update them via PUT (batch)

            const newStages = stages.filter(s => String(s.id).startsWith('temp-'))
            const existingStages = stages.filter(s => !String(s.id).startsWith('temp-'))

            // Create new stages
            const createdStages = []
            for (const stage of newStages) {
                const res = await fetch('/api/pipeline/stages', {
                    method: 'POST',
                    body: JSON.stringify({
                        pipeline_id: selectedPipelineId,
                        name: stage.name,
                        color: stage.color,
                        order_index: stages.indexOf(stage) // Use current index
                    })
                })
                const data = await res.json()
                if (data.stage) {
                    createdStages.push(data.stage)
                }
            }

            // Update existing stages order and data
            const updates = existingStages.map((stage, index) => ({
                id: stage.id,
                name: stage.name,
                color: stage.color,
                order_index: stages.indexOf(stage) // Update order based on current list position taking new ones into account?
                // Wait, if I insert new ones, the indices list is mixed.
                // Actually easier: Upload everything.
            }))

            // Correct approach:
            // 1. Create new items. Get their real IDs.
            // 2. Re-construct the full list with real IDs.
            // 3. Send PUT with full list to update orders.

            // Let's refine:
            // The `createdStages` are now in DB.
            // We need to update `existingStages` too.

            // But I can't easily map the `temp` ones to the `created` ones to know their order unless I do it sequentially or careful mapping.
            // Simple: just update order_index for existing ones relative to their position in `stages` excluding or including temp ones?

            // Better: 
            // 1. Create new ones.
            // 2. Refresh list from server ? No, that loses pending edits to existing ones.

            // Re-map:
            // We know the index of each stage in `stages`.
            // For `existingStages`, updates are easy.
            // For `newStages`, they are created with the correct `order_index`.

            // So: 
            // 1. POST new stages with correct `order_index`.
            // 2. PUT existing stages with correct `order_index` (and name/color).

            // Note: `stages.indexOf(stage)` gives the correct index in the UI list.

            await fetch('/api/pipeline/stages', {
                method: 'PUT',
                body: JSON.stringify({
                    stages: existingStages.map(s => ({
                        ...s,
                        order_index: stages.findIndex(st => st.id === s.id)
                    }))
                })
            })

            toast.success('Pipeline saved successfully')
            fetchPipelines() // Refresh to get real IDs for new items
        } catch (error) {
            console.error(error)
            toast.error('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="max-w-4xl mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Pipeline Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your sales pipeline stages and order</p>
                </div>
                <div className="flex gap-4">
                    <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                            {pipelines.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stages</CardTitle>
                    <CardDescription>Drag and drop to reorder stages.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={stages.map(s => s.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {stages.map((stage) => (
                                <SortableStage
                                    key={stage.id}
                                    id={stage.id}
                                    stage={stage}
                                    onChange={handleStageChange}
                                    onDelete={handleDeleteStage}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <Button
                        variant="outline"
                        className="w-full mt-4 border-dashed"
                        onClick={handleAddStage}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add Stage
                    </Button>
                </CardContent>
            </Card>

            <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                </Button>
            </div>
        </div>
    )
}
