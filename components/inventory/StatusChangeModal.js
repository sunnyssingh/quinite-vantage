'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    AlertCircle, CheckCircle2, Clock, Search, User,
    Phone, Mail, XCircle, ShieldCheck, Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'reserved', label: 'Reserved', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'sold', label: 'Sold', icon: CheckCircle2, color: 'bg-rose-100 text-rose-700 border-rose-300' }
]

export default function StatusChangeModal({ property: unit, isOpen, onClose, onStatusChanged }) {
    const [selectedStatus, setSelectedStatus] = useState(unit?.status || 'available')
    const [loading, setLoading] = useState(false)

    // Lead search state
    const [leadSearch, setLeadSearch] = useState('')
    const [leadResults, setLeadResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)

    // Sold confirmation step state
    const [confirmStep, setConfirmStep] = useState(false)

    // Pre-populate existing lead for current unit
    useEffect(() => {
        if (unit?.lead_id) {
            if (unit.leads) {
                setSelectedLead(unit.leads)
            } else if (unit.lead_id) {
                setSelectedLead({ id: unit.lead_id, name: 'Current Lead' })
            }
        } else {
            setSelectedLead(null)
        }
        setSelectedStatus(unit?.status || 'available')
        setConfirmStep(false)
        setLeadSearch('')
        setLeadResults([])
    }, [unit?.id, isOpen])

    // Debounced lead search
    useEffect(() => {
        if (!leadSearch.trim() || leadSearch.length < 2) {
            setLeadResults([])
            return
        }
        const timer = setTimeout(() => searchLeads(leadSearch), 350)
        return () => clearTimeout(timer)
    }, [leadSearch])

    const searchLeads = async (query) => {
        try {
            setSearchLoading(true)
            const res = await fetch(`/api/leads?search=${encodeURIComponent(query)}&limit=8`)
            const data = await res.json()
            setLeadResults(data.leads || data.data || [])
        } catch (err) {
            console.error('Lead search error:', err)
        } finally {
            setSearchLoading(false)
        }
    }

    const handleStatusSelect = (status) => {
        setSelectedStatus(status)
        setConfirmStep(false)
        if (status === 'available') {
            setSelectedLead(null)
            setLeadSearch('')
            setLeadResults([])
        }
    }

    const handleProceed = () => {
        if (selectedStatus === 'sold' && selectedStatus !== unit?.status) {
            setConfirmStep(true)
            return
        }
        handleSave()
    }

    const handleSave = async () => {
        if (!unit || (selectedStatus === unit.status && !selectedLead)) {
            onClose()
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/inventory/units/${unit.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: selectedStatus,
                    lead_id: selectedLead?.id || null
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status')
            }

            toast.success(`Unit ${unit.unit_number || 'target'} marked as ${selectedStatus}`)

            if (onStatusChanged) {
                onStatusChanged(data.unit, data.projectMetrics)
            }
            onClose()
        } catch (error) {
            console.error('Status update error:', error)
            toast.error(error.message || 'Failed to update unit status')
        } finally {
            setLoading(false)
        }
    }

    if (!unit) return null

    const currentStatusConfig = STATUS_OPTIONS.find(s => s.value === unit.status)
    const isStatusChanged = selectedStatus !== unit.status || (unit.lead_id !== selectedLead?.id)
    const needsLead = selectedStatus === 'reserved' || selectedStatus === 'sold'

    const canSubmit = !loading && (isStatusChanged) && (!needsLead || selectedLead)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg bg-white rounded-3xl border-0 shadow-2xl overflow-hidden p-0">
                <div className={cn(
                    "p-6 text-white transition-colors duration-500",
                    selectedStatus === 'sold' ? 'bg-rose-600' : selectedStatus === 'reserved' ? 'bg-amber-500' : 'bg-emerald-600'
                )}>
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">Status Transition</DialogTitle>
                        </div>
                        <DialogDescription className="text-white/80 font-bold text-xs uppercase tracking-widest leading-none">
                            Updating Unit <span className="text-white bg-black/20 px-1.5 py-0.5 rounded">{unit.unit_number}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 pt-8 space-y-6">
                {confirmStep ? (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center p-6 bg-rose-50 rounded-2xl border border-rose-100">
                            <div className="w-16 h-16 bg-rose-500 rounded-full flex items-center justify-center text-white shadow-xl mb-4 animate-bounce">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h4 className="text-xl font-black text-rose-900 tracking-tight">Confirm Sale Agreement</h4>
                            <p className="text-xs font-bold text-rose-700 mt-2 uppercase tracking-widest max-w-[200px]">
                                This will lock the unit and update revenue metrics.
                            </p>
                        </div>

                        {selectedLead && (
                             <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white text-lg font-black">
                                    {selectedLead.name?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Buyer</p>
                                    <p className="font-black text-slate-800 tracking-tight">{selectedLead.name}</p>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setConfirmStep(false)} disabled={loading} className="flex-1 font-bold uppercase text-[10px] tracking-widest">Back</Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 h-12 font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-100"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                Finalize Sale
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Selectors */}
                        <div className="grid grid-cols-1 gap-3">
                            {STATUS_OPTIONS.map(option => {
                                const Icon = option.icon
                                const isActive = selectedStatus === option.value
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => handleStatusSelect(option.value)}
                                        className={cn(
                                            "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left group",
                                            isActive 
                                                ? 'border-slate-950 bg-slate-950 text-white shadow-xl scale-[1.02]' 
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                                        )}
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            isActive ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-blue-50'
                                        )}>
                                            <Icon className={cn("w-5 h-5", isActive ? 'text-white' : 'text-slate-400')} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none mb-1.5", isActive ? 'text-white/40' : 'text-slate-400')}>Mark as</p>
                                            <p className="font-black tracking-tight text-lg leading-none">{option.label}</p>
                                        </div>
                                        {isActive && <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg"><CheckCircle2 className="w-3.5 h-3.5 text-slate-950" /></div>}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Lead Integration */}
                        {needsLead && (
                            <div className="pt-4 border-t border-slate-100 animate-in slide-in-from-top-4 duration-500">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block opacity-60">Associate Customer Profile</label>
                                
                                {selectedLead ? (
                                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50 border-2 border-blue-100 group">
                                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white text-lg font-black shadow-lg shadow-blue-100">
                                            {selectedLead.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-900 tracking-tight leading-none mb-1">{selectedLead.name}</p>
                                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{selectedLead.phone || 'NO CONTACT'}</p>
                                        </div>
                                        <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-400 hover:text-red-500">
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                        <Input
                                            className="h-12 pl-11 rounded-2xl bg-slate-50 border-slate-100 font-bold text-sm tracking-tight placeholder:text-slate-300 focus:bg-white transition-all focus:border-blue-400"
                                            placeholder="Search leads by name or phone..."
                                            value={leadSearch}
                                            onChange={e => setLeadSearch(e.target.value)}
                                        />
                                        {searchLoading && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-blue-500" />}

                                        {leadResults.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-100 shadow-2xl z-50 py-2 max-h-[240px] overflow-y-auto">
                                                {leadResults.map(lead => (
                                                    <button
                                                        key={lead.id}
                                                        onClick={() => { setSelectedLead(lead); setLeadResults([]); setLeadSearch('') }}
                                                        className="w-full flex items-center gap-4 px-4 py-3 hover:bg-blue-50/50 transition-colors text-left"
                                                    >
                                                        <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-sm font-black uppercase">
                                                            {lead.name?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 tracking-tight leading-none mb-1">{lead.name}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{lead.phone || lead.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button variant="ghost" onClick={onClose} disabled={loading} className="flex-1 h-12 font-black uppercase text-[10px] tracking-widest text-slate-400 border-0">Cancel</Button>
                            <Button
                                onClick={handleProceed}
                                disabled={!canSubmit}
                                className={cn(
                                    "flex-1 h-12 font-black uppercase text-xs tracking-widest shadow-xl transition-all duration-300",
                                    !canSubmit ? "opacity-30" : "hover:scale-[1.02] active:scale-[0.98]",
                                    selectedStatus === 'sold' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-100' : selectedStatus === 'reserved' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-100' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                                )}
                            >
                                {loading && <Loader2 className="w-3 h-3 animate-spin mr-2" />}
                                Update Now
                            </Button>
                        </div>
                    </div>
                )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
