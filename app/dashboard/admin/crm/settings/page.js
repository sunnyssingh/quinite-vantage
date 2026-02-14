'use client'

import { useState, useEffect } from 'react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import { GripVertical, Trash2, Plus, Save, Loader2, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function SortableStage({ id, stage, onChange, onDelete, canDelete }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    return (
        <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl mb-3 shadow-sm hover:shadow-md transition-all duration-200 group">
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
                disabled={!canDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                title={!canDelete ? "Minimum 3 stages required" : "Delete stage"}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}

export default function CrmSettingsPage() {
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
        // Prevent deletion if fewer than 3 stages would remain
        if (stages.length <= 3) {
            toast.error('Cannot delete stage. Minimum 3 stages required for pipeline.')
            return
        }

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
            const newStages = stages.filter(s => String(s.id).startsWith('temp-'))
            const existingStages = stages.filter(s => !String(s.id).startsWith('temp-'))

            // Create new stages
            for (const stage of newStages) {
                await fetch('/api/pipeline/stages', {
                    method: 'POST',
                    body: JSON.stringify({
                        pipeline_id: selectedPipelineId,
                        name: stage.name,
                        color: stage.color,
                        order_index: stages.indexOf(stage)
                    })
                })
            }

            // Update existing stages
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
            fetchPipelines()
        } catch (error) {
            console.error(error)
            toast.error('Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <SettingsSkeleton />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings2 className="h-6 w-6 text-blue-600" />
                        Pipeline Stages
                    </h1>
                    <p className="text-gray-500 mt-1">Customize your sales pipeline by adding, removing, and reordering stages.</p>
                </div>

            </div>

            {/* Pipeline Stages Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Manage Stages</CardTitle>
                    <CardDescription>
                        Drag and drop to reorder stages. Minimum 3 stages required. Changes apply to the selected pipeline.
                    </CardDescription>
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
                                    canDelete={stages.length > 3}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>

                    <Button
                        variant="outline"
                        className="w-full mt-4 border-dashed hover:border-blue-400 hover:text-blue-600 transition-colors"
                        onClick={handleAddStage}
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add New Stage
                    </Button>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} size="lg" className="w-full sm:w-auto sm:min-w-[140px]">
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!saving && <Save className="h-4 w-4 mr-2" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

function SettingsSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-full md:w-[250px]" />
            </div>

            <div className="space-y-6">
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-32" />
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                                <Skeleton className="h-5 w-5" />
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Skeleton className="h-9 w-full" />
                                    <Skeleton className="h-9 w-32" />
                                </div>
                                <Skeleton className="h-8 w-8" />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
