'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building, Plus, Search, Filter, Home, CheckCircle2, Clock, MapPin, Edit, TrendingUp, Maximize, Bed } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import StatusChangeModal from '@/components/inventory/StatusChangeModal'
import EditUnitModal from '@/components/inventory/EditUnitModal'
import { toast } from 'react-hot-toast'
import Link from 'next/link'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { useInventoryUnits } from '@/hooks/useInventory'
import { useQueryClient } from '@tanstack/react-query'

export default function ProjectInventoryTab({ projectId, project, onMetricsUpdate }) {
    const queryClient = useQueryClient()
    
    // 1. Parallel Fetching (Hydrates instantly if hovered earlier)
    const { 
        data: units = [], 
        isLoading: loading,
        refetch: fetchUnits 
    } = useInventoryUnits(projectId)

    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [selectedUnit, setSelectedUnit] = useState(null)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [editingUnit, setEditingUnit] = useState(null)
    const [showEditModal, setShowEditModal] = useState(false)


    const handleStatusChanged = (updatedUnit, projectMetrics) => {
        // Sync everything
        queryClient.invalidateQueries({ queryKey: ['inventory-units', projectId] })
        queryClient.invalidateQueries({ queryKey: ['inventory-project', projectId] })
        queryClient.invalidateQueries({ queryKey: ['inventory-projects'] })

        if (onMetricsUpdate && projectMetrics) {
            onMetricsUpdate(projectMetrics)
        }
    }

    const handleUnitUpdated = (updatedUnit) => {
        queryClient.invalidateQueries({ queryKey: ['inventory-units', projectId] })
        queryClient.invalidateQueries({ queryKey: ['inventory-projects'] })
    }


    const filteredUnits = units.filter(p => {
        const matchesSearch = (p.unit_number?.toLowerCase().includes(search.toLowerCase())) ||
            (p.title?.toLowerCase().includes(search.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const statusConfig = {
        available: { color: 'bg-emerald-100 text-emerald-700 border-emerald-300', label: 'Available', icon: Home },
        reserved: { color: 'bg-amber-100 text-amber-700 border-amber-300', label: 'Reserved', icon: Clock },
        sold: { color: 'bg-slate-100 text-slate-700 border-slate-300', label: 'Sold', icon: CheckCircle2 },
        blocked: { color: 'bg-red-100 text-red-700 border-red-300', label: 'Blocked', icon: Clock },
        under_maintenance: { color: 'bg-purple-100 text-purple-700 border-purple-300', label: 'Maintenance', icon: Clock }
    }

    const statusCounts = {
        all: units.length,
        available: units.filter(p => p.status === 'available').length,
        reserved: units.filter(p => p.status === 'reserved').length,
        sold: units.filter(p => p.status === 'sold').length
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 bg-slate-50/50 rounded-2xl border border-dashed">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 rounded-xl">
                            <Building className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight text-slate-900 leading-none">Inventory Units</h3>
                            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                {units.length} TOTAL REGISTERED UNITS
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                     <div className="flex -space-x-2">
                        {Object.entries(statusCounts).map(([status, count]) => status !== 'all' && count > 0 && (
                            <div key={status} className={`w-8 h-8 rounded-full border-2 border-white ${statusConfig[status]?.color.split(' ')[0]} flex items-center justify-center shadow-sm`} title={`${count} ${status}`}>
                                <span className="text-[10px] font-black tabular-nums">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Informational Notice */}
            <div className="flex items-center gap-3 bg-blue-600 p-4 rounded-xl text-white shadow-lg shadow-blue-100">
                <div className="p-1.5 bg-blue-500/50 rounded-lg">
                    <TrendingUp className="w-4 h-4" />
                </div>
                <p className="text-[11px] font-bold uppercase tracking-widest">
                    Real-time Inventory Management: Units derive default values from configurations. Custom overrides are highlighted.
                </p>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <Input
                        placeholder="Search by unit number or title..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11 bg-slate-50 border-slate-100 font-bold text-sm tracking-tight placeholder:text-slate-300 focus:bg-white transition-all"
                    />
                </div>
                <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
                    <SelectTrigger className="w-full sm:w-[220px] h-11 bg-slate-50 border-slate-100 font-bold uppercase text-[10px] tracking-widest">
                        <Filter className="w-3.5 h-3.5 mr-2 text-blue-500" />
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all" className="font-bold uppercase text-[10px]">All ({statusCounts.all})</SelectItem>
                        <SelectItem value="available" className="font-bold uppercase text-[10px]">Available ({statusCounts.available})</SelectItem>
                        <SelectItem value="reserved" className="font-bold uppercase text-[10px]">Reserved ({statusCounts.reserved})</SelectItem>
                        <SelectItem value="sold" className="font-bold uppercase text-[10px]">Sold ({statusCounts.sold})</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Units Grid */}
            {
                filteredUnits.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-dashed rounded-2xl border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building className="w-8 h-8 text-slate-200" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-2">
                             {search || statusFilter !== 'all' ? 'No Matching Units' : 'Inventory Empty'}
                        </h3>
                        <p className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">
                            {search || statusFilter !== 'all'
                                ? 'Adjust your search query or status filter'
                                : 'Start by generating units from the Tower Grid view'}
                        </p>
                        <Button variant="outline" className="rounded-full px-8 h-10 font-black uppercase text-[10px] tracking-widest" onClick={() => { setSearch(''); setStatusFilter('all'); }}>
                            Clear All Filters
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredUnits.map(unit => {
                            const status = statusConfig[unit.status] || statusConfig.available
                            const StatusIcon = status.icon
                            const displayPrice = unit.total_price || unit.base_price || 0

                            return (
                                <Card key={unit.id} className="border-slate-200 hover:border-blue-400 hover:shadow-xl transition-all duration-500 rounded-2xl overflow-hidden group">
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">#{unit.unit_number}</span>
                                                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[9px] h-4 py-0 px-1 border-0 font-black uppercase tracking-tighter">
                                                        {unit.config?.config_name || 'Standard'}
                                                    </Badge>
                                                </div>
                                                <h4 className="font-black text-base text-slate-800 tracking-tight leading-none truncate max-w-[140px]">
                                                    {unit.title || `Unit ${unit.unit_number}`}
                                                </h4>
                                            </div>
                                            <Badge variant="outline" className={`${status.color} border px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest leading-none`}>
                                                {status.label}
                                            </Badge>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valuation</p>
                                            <p className="text-lg font-black text-slate-900 tracking-tighter">
                                                ₹{Number(displayPrice).toLocaleString('en-IN')}
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2">
                                                <Maximize className="w-3.5 h-3.5 text-blue-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Area</span>
                                                    <span className="text-[11px] font-bold text-slate-700 leading-none">{unit.carpet_area || 0} SQFT</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Bed className="w-3.5 h-3.5 text-blue-400" />
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-0.5">Layout</span>
                                                    <span className="text-[11px] font-bold text-slate-700 leading-none">{unit.bedrooms || 0} BHK</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 h-9 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                onClick={() => {
                                                    setSelectedUnit(unit)
                                                    setShowStatusModal(true)
                                                }}
                                            >
                                                Status
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-9 w-9 rounded-xl border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm"
                                                onClick={() => {
                                                    setEditingUnit(unit)
                                                    setShowEditModal(true)
                                                }}
                                            >
                                                <Edit className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )
            }

            {/* Status Change Modal */}
            <StatusChangeModal
                property={selectedUnit}
                isOpen={showStatusModal}
                onClose={() => {
                    setShowStatusModal(false)
                    setSelectedUnit(null)
                }}
                onStatusChanged={handleStatusChanged}
            />

            {/* Edit Unit Modal */}
            <EditUnitModal
                unit={editingUnit}
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false)
                    setEditingUnit(null)
                }}
                onUnitUpdated={handleUnitUpdated}
            />
        </div >
    )
}
