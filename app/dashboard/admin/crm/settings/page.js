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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'

function SortableStage({ id, stage, onChange, onDelete }) {
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
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
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
                        CRM Settings
                    </h1>
                    <p className="text-gray-500 mt-1">Configure pipeline stages, lead sources, and automation rules.</p>
                </div>
                <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId}>
                    <SelectTrigger className="w-full md:w-[250px]">
                        <SelectValue placeholder="Select Pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                        {pipelines.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="pipeline" className="w-full">
                <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-flex">
                    <TabsTrigger value="pipeline">Pipeline Stages</TabsTrigger>
                    <TabsTrigger value="sources">Lead Sources</TabsTrigger>
                    <TabsTrigger value="automation">Automation</TabsTrigger>
                </TabsList>

                {/* Pipeline Stages Tab */}
                <TabsContent value="pipeline" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Pipeline Stages</CardTitle>
                            <CardDescription>Drag and drop to reorder stages. Changes apply to the selected pipeline.</CardDescription>
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
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </TabsContent>

                {/* Lead Sources Tab */}
                <TabsContent value="sources" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Sources</CardTitle>
                            <CardDescription>Manage where your leads come from</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-gray-500">
                                <p>Lead source management coming soon...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Automation Tab */}
                <TabsContent value="automation" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Automation Rules</CardTitle>
                            <CardDescription>Set up automated workflows and triggers</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-12 text-gray-500">
                                <p>Automation rules coming soon...</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
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
