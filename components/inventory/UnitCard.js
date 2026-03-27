'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    MapPin, Bed, Bath, Layout, EyeOff, Eye, Lock,
    Building2, Edit, RefreshCcw, Maximize, TrendingUp
} from 'lucide-react'
import { toast } from 'react-hot-toast'

import EditUnitModal from './EditUnitModal'
import StatusChangeModal from './StatusChangeModal'

import { formatINR } from '@/lib/inventory'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function UnitCard({ unit: initialUnit, onActionComplete, canManage = false, canEdit = false }) {
    const [unit, setUnit] = useState(initialUnit)
    const [toggling, setToggling] = useState(false)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isStatusOpen, setIsStatusOpen] = useState(false)

    // Status badge configuration
    const getStatusConfig = (status) => {
        switch (status) {
            case 'available': return { bg: 'bg-emerald-500', text: 'text-white', label: 'Available', icon: '✓', shadow: 'shadow-emerald-100' }
            case 'sold': return { bg: 'bg-slate-500', text: 'text-white', label: 'Sold', icon: '✓', shadow: 'shadow-slate-100' }
            case 'reserved': return { bg: 'bg-amber-500', text: 'text-white', label: 'Reserved', icon: '⏱', shadow: 'shadow-amber-100' }
            case 'blocked': return { bg: 'bg-red-500', text: 'text-white', label: 'Blocked', icon: '✕', shadow: 'shadow-red-100' }
            case 'under_maintenance': return { bg: 'bg-orange-500', text: 'text-white', label: 'Maintenance', icon: '🔧', shadow: 'shadow-orange-100' }
            default: return { bg: 'bg-blue-500', text: 'text-white', label: status, icon: '', shadow: 'shadow-blue-100' }
        }
    }

    const statusConfig = getStatusConfig(unit.status || 'available')
    
    // Schema field mapping
    const title = unit.unit_number ? `Unit ${unit.unit_number}` : 'Unnamed Unit'
    const carpetArea = unit.carpet_area || unit.config?.carpet_area || 0
    const bedrooms = unit.bedrooms || unit.config?.bedrooms || 0
    const bathrooms = unit.bathrooms || unit.config?.bathrooms || 0
    const face = unit.facing || unit.config?.facing
    const configName = unit.config?.config_name || unit.config?.property_type || 'Custom Unit'

    return (
        <TooltipProvider>
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden group flex flex-col h-full border hover:border-blue-200">
                {/* Header Section */}
                <div className="p-4 pb-0">
                    <div className="flex justify-between items-start mb-3">
                        <Badge className={`${statusConfig.bg} ${statusConfig.text} uppercase text-[9px] font-black tracking-widest h-5 px-2 shadow-sm border-0 rounded-full`}>
                            {statusConfig.label}
                        </Badge>
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest tabular-nums">
                            {unit.tower?.name || 'T1'} • L{unit.floor_number || 0}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                             <h3 className="font-black text-lg tracking-tight text-slate-900 leading-none">
                                {unit.unit_number}
                            </h3>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-0 text-[9px] h-4 px-1.5 uppercase font-black tracking-tighter">
                                {configName}
                            </Badge>
                        </div>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-blue-400" />
                            {unit.transaction_type === 'rent' ? 'Rental Property' : 'For Sale'}
                        </p>
                    </div>
                </div>

                {/* Main Info */}
                <CardContent className="p-4 pt-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-4">
                        {/* Price Display */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Value</div>
                            <div className="text-xl font-black text-slate-900 tracking-tight">
                                {formatINR(unit.total_price || unit.base_price || 0)}
                            </div>
                        </div>

                        {/* Property Specs */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dimension</div>
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Maximize className="w-3.5 h-3.5 text-blue-500" />
                                    {carpetArea} <span className="text-[9px] text-slate-400 font-medium">SQFT</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Layout</div>
                                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                                    <Bed className="w-3.5 h-3.5 text-blue-500" />
                                    {bedrooms} <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap">BHK / {bathrooms} BA</span>
                                </div>
                            </div>
                        </div>

                        {/* Tags / Metadata */}
                        <div className="flex flex-wrap gap-1.5 min-h-[1.5rem]">
                            {face && (
                                <Badge variant="outline" className="bg-white border-slate-200 text-[9px] font-bold py-0 h-4 uppercase px-1.5 text-slate-500">
                                    {face} facing
                                </Badge>
                            )}
                            {unit.is_corner && (
                                <Badge variant="outline" className="bg-amber-50 border-amber-100 text-[9px] font-bold py-0 h-4 uppercase px-1.5 text-amber-600">
                                    Corner
                                </Badge>
                            )}
                            {unit.is_vastu_compliant && (
                                <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-[9px] font-bold py-0 h-4 uppercase px-1.5 text-emerald-600">
                                    Vastu
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-2 mt-6 border-t border-slate-50 pt-4">
                        <Button
                            variant="default"
                            size="sm"
                            className="flex-1 h-9 bg-slate-900 hover:bg-black text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-slate-200"
                            onClick={() => setIsStatusOpen(true)}
                            disabled={!canManage && !canEdit}
                        >
                            <RefreshCcw className="w-3 h-3 mr-2" />
                            Update Status
                        </Button>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-lg border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
                                    onClick={() => setIsEditOpen(true)}
                                    disabled={!canEdit && !canManage}
                                >
                                    <Edit className="w-3.5 h-3.5" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Manage Unit Details</TooltipContent>
                        </Tooltip>
                    </div>
                </CardContent>

                <EditUnitModal
                    unit={unit}
                    isOpen={isEditOpen}
                    onClose={() => setIsEditOpen(false)}
                    onUnitUpdated={(updatedUnit) => {
                        setUnit(updatedUnit)
                        if (onActionComplete) onActionComplete()
                    }}
                    onActionComplete={onActionComplete}
                />

                <StatusChangeModal
                    property={unit}
                    isOpen={isStatusOpen}
                    onClose={() => setIsStatusOpen(false)}
                    onStatusChanged={(updatedUnit) => {
                        setUnit(updatedUnit)
                        if (onActionComplete) onActionComplete()
                    }}
                />
            </Card>
        </TooltipProvider>
    )
}
