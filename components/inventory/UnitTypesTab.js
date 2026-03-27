'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    Plus, 
    Edit, 
    Trash2, 
    Layers, 
    Home, 
    Building2, 
    Store, 
    Briefcase,
    ShoppingBag,
    Factory,
    ConciergeBell,
    ExternalLink
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useInventory } from '@/hooks/useInventory'
import { useQueryClient } from '@tanstack/react-query'
import ResidentialConfigForm from '@/components/projects/ResidentialConfigForm'
import { toast } from 'react-hot-toast'
import { formatINR } from '@/lib/inventory'
import { cn } from '@/lib/utils'

export default function UnitTypesTab({ projectId, project }) {
    const queryClient = useQueryClient()
    const { updateProjectUnits, units } = useInventory({ 
        projectId, 
        organizationId: project?.organization_id 
    })

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingConfig, setEditingConfig] = useState(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Calculate actual counts for each config from the physical grid
    const unitCountsByConfigId = useMemo(() => {
        const allUnits = Object.values(units).flat()
        return allUnits.reduce((acc, unit) => {
            const configId = unit.unit_config_id || unit.unit_config
            if (configId) {
                acc[configId] = (acc[configId] || 0) + 1
            }
            return acc
        }, {})
    }, [units])

    const unitConfigs = project?.unit_types || []

    const handleSave = async (configData) => {
        try {
            let updatedConfigs = []
            if (editingConfig) {
                // Update existing
                updatedConfigs = unitConfigs.map((c, idx) => {
                    // Match by index or ID
                    const isMatch = editingConfig.id ? (c.id === editingConfig.id) : (idx === editingConfig._idx)
                    return isMatch ? { ...configData, id: c.id || editingConfig.id } : c
                })
            } else {
                // Add new with unique ID
                const newConfig = {
                    ...configData,
                    id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
                }
                updatedConfigs = [...unitConfigs, newConfig]
            }

            await updateProjectUnits(updatedConfigs)
            queryClient.invalidateQueries({ queryKey: ['inventory-project', projectId] })
            setIsFormOpen(false)
            setEditingConfig(null)
        } catch (error) {
            console.error('Save unit type error:', error)
        }
    }

    const handleDelete = async (index, config) => {
        const configId = config.id || config.configuration
        const usageCount = unitCountsByConfigId[configId] || 0
        
        if (usageCount > 0) {
            toast.error(`Cannot delete: ${usageCount} units of this type are already placed on the floor plan.`)
            return
        }

        if (!confirm('Are you sure you want to delete this unit type?')) return

        try {
            const updatedConfigs = unitConfigs.filter((_, i) => i !== index)
            await updateProjectUnits(updatedConfigs)
            queryClient.invalidateQueries({ queryKey: ['inventory-project', projectId] })
            toast.success('Unit type removed')
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const getIcon = (type) => {
        const icons = {
            'Apartment': Building2,
            'Villa Bungalow': Home,
            'Penthouse': ConciergeBell,
            'Office': Briefcase,
            'Retail': ShoppingBag,
            'Showroom': Store,
            'Industrial': Factory,
            'Plot': Home,
            'Land': Building2
        }
        return icons[type] || Building2
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-foreground">Unit Types & Configurations</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Define common property layouts for this project to use in the visual grid.
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setEditingConfig(null)
                        setIsFormOpen(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                    <Plus className="w-4 h-4 mr-2" /> Add Unit Type
                </Button>
            </div>

            {unitConfigs.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-3xl bg-slate-50/50">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <Layers className="w-8 h-8 text-slate-300" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-900">No Unit Types Defined</h4>
                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">
                        Start by adding the different types of units available in this project (e.g., 3BHK Flat, Office Space).
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={() => setIsFormOpen(true)}
                        className="mt-6"
                    >
                        Create First Type
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {unitConfigs.map((config, idx) => {
                        const Icon = getIcon(config.property_type || config.type)
                        const configId = config.id || config.configuration
                        const placedCount = unitCountsByConfigId[configId] || 0
                        const totalCount = parseInt(config.count || 0)
                        const completionRate = Math.min(100, (placedCount / (totalCount || 1)) * 100)
                        const isComplete = placedCount >= totalCount

                        return (
                            <Card key={idx} className="group relative border-slate-200 hover:border-blue-400 hover:shadow-lg transition-all duration-300 rounded-2xl bg-white flex flex-col min-h-[180px]">
                                <CardContent className="p-4 flex flex-col h-full">
                                    {/* Action Buttons (Top Right) */}
                                    <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={() => {
                                                setEditingConfig({ ...config, _idx: idx })
                                                setIsFormOpen(true)
                                            }}
                                        >
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleDelete(idx, config)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>

                                    {/* Core Info */}
                                    <div className="flex gap-3 mb-4">
                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                            <Icon className="w-5 h-5 text-slate-500 group-hover:text-blue-600 transition-colors" />
                                        </div>
                                        <div className="flex-1 min-w-0 pr-12">
                                            <h4 className="text-sm font-bold text-slate-900 truncate leading-tight">
                                                {config.configuration || config.property_type || 'Unit'}
                                            </h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate mt-0.5">
                                                {config.property_type || 'Type'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Grid of details */}
                                    <div className="grid grid-cols-2 gap-y-3 mb-auto">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Price</p>
                                            <p className="text-xs font-bold text-slate-700 mt-1 truncate">{formatINR(config.price)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Area</p>
                                            <p className="text-xs font-bold text-slate-700 mt-1 truncate">{config.carpet_area} <span className="text-[8px]">{config.area_unit || 'sqft'}</span></p>
                                        </div>
                                    </div>

                                    {/* Footer Section with Progress */}
                                    <div className="mt-4 pt-4 border-t border-slate-50">
                                        <div className="flex justify-between items-center mb-1.5">
                                            <div className="flex items-center gap-1.5">
                                               <span className={cn(
                                                   "text-[10px] font-black uppercase tracking-tight",
                                                   isComplete ? "text-emerald-500" : "text-blue-500"
                                               )}>
                                                   {placedCount}/{totalCount}
                                               </span>
                                               <span className="text-[8px] font-bold text-slate-300">UNITS</span>
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black leading-none",
                                                isComplete ? "text-emerald-600" : "text-slate-400"
                                            )}>
                                                {Math.round(completionRate)}%
                                            </span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={cn(
                                                    "h-full transition-all duration-700",
                                                    isComplete ? "bg-emerald-500" : "bg-blue-500"
                                                )}
                                                style={{ width: `${completionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            <Dialog open={isFormOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsFormOpen(false)
                    setEditingConfig(null)
                }
            }}>
                <DialogContent className="max-w-xl p-0 overflow-hidden border-0 rounded-3xl shadow-2xl">
                    <div className="bg-slate-900 px-6 py-5">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                                    <Layers className="w-5 h-5 text-blue-400" />
                                </div>
                                {editingConfig ? 'Edit Unit Type' : 'Add Unit Type'}
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-6">
                        <ResidentialConfigForm 
                            onCancel={() => {
                                setIsFormOpen(false)
                                setEditingConfig(null)
                            }}
                            onAdd={handleSave}
                            category={project?.real_estate?.property?.category || 'residential'}
                            initialData={editingConfig}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
