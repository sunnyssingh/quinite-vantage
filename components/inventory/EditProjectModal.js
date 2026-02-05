'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'react-hot-toast'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import ResidentialConfigForm from '@/components/projects/ResidentialConfigForm'

export default function EditProjectModal({ project, isOpen, onClose, onProjectUpdated }) {
    const [loading, setLoading] = useState(false)
    const [showAddConfig, setShowAddConfig] = useState(false)
    const [formData, setFormData] = useState({
        totalUnits: '',
        projectStatus: 'planning',
        unitTypes: [] // Array of { type: '', count: '' }
    })

    useEffect(() => {
        if (project) {
            setFormData({
                totalUnits: project.total_units || '',
                projectStatus: project.project_status || 'planning',
                unitTypes: Array.isArray(project.unit_types) ? project.unit_types : []
            })
        }
    }, [project])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const response = await fetch(`/api/projects/${project.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    total_units: Number(formData.totalUnits),
                    project_status: formData.projectStatus,
                    unit_types: formData.unitTypes
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update project')
            }

            toast.success('Project updated successfully')

            if (onProjectUpdated) {
                onProjectUpdated(data.project)
            }

            onClose()
        } catch (error) {
            console.error('Update project error:', error)
            toast.error(error.message || 'Failed to update project')
        } finally {
            setLoading(false)
        }
    }

    if (!project) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Project Inventory</DialogTitle>
                    <DialogDescription>
                        Update inventory settings for <span className="font-semibold text-foreground">{project.name}</span>
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Total Units */}
                    <div className="space-y-2">
                        <Label htmlFor="totalUnits">Total Units</Label>
                        <Input
                            id="totalUnits"
                            type="number"
                            value={formData.totalUnits}
                            onChange={(e) => setFormData(prev => ({ ...prev, totalUnits: e.target.value }))}
                            placeholder="e.g., 120"
                            min="0"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Total number of units in this project
                        </p>
                    </div>

                    {/* Project Status */}
                    <div className="space-y-2">
                        <Label htmlFor="projectStatus">Project Status</Label>
                        <select
                            id="projectStatus"
                            value={formData.projectStatus}
                            onChange={(e) => setFormData(prev => ({ ...prev, projectStatus: e.target.value }))}
                            className="w-full rounded-lg border-2 border-input px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:border-input transition-all"
                            required
                        >
                            <option value="planning">Planning</option>
                            <option value="under_construction">Under Construction</option>
                            <option value="ready_to_move">Ready to Move</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>

                    {/* Unit Types Breakdown */}
                    <div className="space-y-3 pt-2 border-t">
                        <div className="flex items-center justify-between">
                            <Label>Unit Types Breakdown</Label>
                            {!showAddConfig && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowAddConfig(true)}
                                >
                                    <Plus className="w-3 h-3 mr-1" /> Add Configuration
                                </Button>
                            )}
                        </div>

                        {showAddConfig ? (
                            <ResidentialConfigForm
                                onCancel={() => setShowAddConfig(false)}
                                category={formData.category || project.real_estate?.category || 'Residential'}
                                priceRange={{ min: project.pricing?.min || 0, max: project.pricing?.max || 0 }}
                                onAdd={(newConfig) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        unitTypes: [...prev.unitTypes, newConfig]
                                    }))
                                    setShowAddConfig(false)
                                }}
                            />
                        ) : (
                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                                {formData.unitTypes.map((ut, index) => (
                                    <div key={index} className="flex gap-2 items-center p-3 border rounded-lg bg-muted/10">
                                        <div className="flex-1">
                                            {ut.configuration ? (
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">
                                                        {ut.configuration} {ut.property_type || ut.type}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {ut.carpet_area} sqft • {ut.transaction_type || 'Sell'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="font-medium text-sm">{ut.type}</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col items-end">
                                                <span className="text-xs text-muted-foreground">Count</span>
                                                <span className="font-bold">{ut.count}</span>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive/90 h-8 w-8"
                                                onClick={() => {
                                                    const newTypes = formData.unitTypes.filter((_, i) => i !== index)
                                                    setFormData(prev => ({ ...prev, unitTypes: newTypes }))
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {formData.unitTypes.length === 0 && (
                                    <p className="text-xs text-muted-foreground italic text-center py-4">
                                        No configurations defined. Click "Add Configuration" to start.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Project'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
