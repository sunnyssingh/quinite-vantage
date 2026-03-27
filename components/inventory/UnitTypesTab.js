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
    Settings2,
    CheckCircle2,
    Component
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useInventory, useUnitConfigs } from '@/hooks/useInventory'
import { useQueryClient } from '@tanstack/react-query'
import ResidentialConfigForm from '@/components/projects/ResidentialConfigForm'
import { toast } from 'react-hot-toast'
import { formatINR } from '@/lib/inventory'
import { cn } from '@/lib/utils'

export default function UnitTypesTab({ projectId, project }) {
    const queryClient = useQueryClient()
    const { 
        saveUnitConfig, 
        deleteUnitConfig, 
        units 
    } = useInventory({ 
        projectId, 
        organizationId: project?.organization_id 
    })

    const { data: unitConfigs = [], isLoading: configsLoading } = useUnitConfigs(projectId)

    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingConfig, setEditingConfig] = useState(null)

    // Calculate actual counts for each config from the physical grid
    const unitCountsByConfigId = useMemo(() => {
        const allUnits = Object.values(units).flat()
        return allUnits.reduce((acc, unit) => {
            const configId = unit.config_id || unit.unit_config_id
            if (configId) {
                acc[configId] = (acc[configId] || 0) + 1
            }
            return acc
        }, {})
    }, [units])

    const handleSave = async (configData) => {
        try {
            await saveUnitConfig({
                ...configData,
                projectId,
                id: editingConfig?.id || null
            })
            setIsFormOpen(false)
            setEditingConfig(null)
            toast.success(editingConfig ? 'Configuration Updated' : 'Prototype Initialized')
        } catch (error) {
            console.error('Save unit type error:', error)
            toast.error('Failed to save configuration')
        }
    }

    const handleDelete = async (config) => {
        const usageCount = unitCountsByConfigId[config.id] || 0
        if (usageCount > 0) {
            toast.error(`Constraint Violation: ${usageCount} units already utilizing this profile.`)
            return
        }
        if (!confirm('Are you sure you want to delete this unit configuration?')) return
        try {
            await deleteUnitConfig(config.id)
            toast.success('Profile Deprecated')
        } catch (error) {
            console.error('Delete error:', error)
            toast.error('Failed to delete configuration')
        }
    }

    const getIcon = (type) => {
        const icons = {
            'Apartment': Building2,
            'Villa': Home,
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

    if (configsLoading) return <div className="p-20 text-center"><div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" /></div>

    return (
        <div className="space-y-10 py-6">
            <div className="flex justify-between items-end px-2">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                         <div className="p-1.5 bg-blue-100 rounded-lg">
                            <Component className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Inventory Templates</span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Unit Master Catalog</h3>
                    <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest flex items-center gap-2">
                        Global definitions for unit structures and pricing models.
                    </p>
                </div>
                <Button 
                    onClick={() => {
                        setEditingConfig(null)
                        setIsFormOpen(true)
                    }}
                    className="bg-slate-900 hover:bg-black h-12 px-8 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-slate-200 transition-all hover:scale-[1.05] active:scale-[0.95]"
                >
                    <Plus className="w-4 h-4 mr-2" /> Initialize Profile
                </Button>
            </div>

            {unitConfigs.length === 0 ? (
                <div className="text-center py-24 border-2 border-dashed border-slate-100 rounded-[40px] bg-slate-50/30">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto mb-6 border border-slate-100">
                        <Layers className="w-10 h-10 text-slate-200" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">Catalog is Empty</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-[240px] mx-auto mt-3 leading-relaxed">
                        Start by creating master unit profiles to accelerate your grid layout.
                    </p>
                    <Button 
                        variant="outline" 
                        onClick={() => setIsFormOpen(true)}
                        className="mt-8 h-12 px-8 rounded-xl border-slate-200 font-black uppercase text-[10px] tracking-widest hover:bg-white hover:shadow-lg transition-all"
                    >
                        Define First Profile
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {unitConfigs.map((config) => {
                        const Icon = getIcon(config.property_type)
                        const placedCount = unitCountsByConfigId[config.id] || 0

                        return (
                            <Card key={config.id} className="group relative border-0 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 rounded-[32px] bg-white overflow-hidden flex flex-col min-h-[220px]">
                                <CardContent className="p-0 flex flex-col h-full">
                                    {/* Action Header */}
                                    <div className="p-6 pb-2 flex justify-between items-start">
                                         <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-blue-600 group-hover:border-blue-500 transition-all duration-500 shadow-sm">
                                            <Icon className="w-6 h-6 text-slate-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 duration-500">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-100 text-slate-400 hover:text-blue-600 border border-slate-100"
                                                onClick={() => {
                                                    setEditingConfig(config)
                                                    setIsFormOpen(true)
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-red-100 text-slate-400 hover:text-red-600 border border-slate-100"
                                                onClick={() => handleDelete(config)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="px-6 space-y-1">
                                        <h4 className="text-xl font-black text-slate-900 tracking-tight truncate group-hover:text-blue-600 transition-colors">
                                            {config.config_name || 'Untitled Template'}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{config.property_type}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{config.category}</span>
                                        </div>
                                    </div>

                                    <div className="px-6 py-6 mt-4 flex items-center justify-between bg-slate-50/50">
                                         <div className="space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Target Value</p>
                                            <p className="text-base font-black text-slate-900 tracking-tight">{formatINR(config.base_price)}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Net Asset Size</p>
                                            <p className="text-base font-black text-slate-900 tracking-tight">
                                                {config.category === 'land' ? config.plot_area : config.carpet_area} <span className="text-[10px] text-slate-400 font-bold uppercase ml-0.5">SQFT</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-auto px-6 py-4 flex justify-between items-center border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                                                {placedCount} ACTIVE LISTINGS
                                            </span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] h-6 px-3 bg-white border-slate-200 text-slate-600 font-black uppercase tracking-widest shadow-sm rounded-lg">
                                            {config.transaction_type}
                                        </Badge>
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
                <DialogContent className="max-w-xl p-0 overflow-hidden border-0 rounded-[28px] shadow-2xl bg-[#f8fbff]">
                    <div className="p-5">
                        <ResidentialConfigForm 
                            onCancel={() => {
                                setIsFormOpen(false)
                                setEditingConfig(null)
                            }}
                            onAdd={handleSave}
                            category={editingConfig?.category || project?.category || 'residential'}
                            initialData={editingConfig}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
