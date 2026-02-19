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

const STATUS_OPTIONS = [
    { value: 'available', label: 'Available', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    { value: 'reserved', label: 'Reserved', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300' },
    { value: 'sold', label: 'Sold', icon: CheckCircle2, color: 'bg-rose-100 text-rose-700 border-rose-300' }
]

export default function StatusChangeModal({ property, isOpen, onClose, onStatusChanged }) {
    const [selectedStatus, setSelectedStatus] = useState(property?.status || 'available')
    const [loading, setLoading] = useState(false)

    // Lead search state
    const [leadSearch, setLeadSearch] = useState('')
    const [leadResults, setLeadResults] = useState([])
    const [searchLoading, setSearchLoading] = useState(false)
    const [selectedLead, setSelectedLead] = useState(null)

    // Sold confirmation state
    const [confirmStep, setConfirmStep] = useState(false)

    // Pre-populate existing lead for current property
    useEffect(() => {
        if (property?.leads?.length > 0) {
            setSelectedLead(property.leads[0])
        } else {
            setSelectedLead(null)
        }
        setSelectedStatus(property?.status || 'available')
        setConfirmStep(false)
        setLeadSearch('')
        setLeadResults([])
    }, [property?.id, isOpen])

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
        // Clear lead search when switching status modes
        if (status === 'available') {
            setSelectedLead(null)
            setLeadSearch('')
            setLeadResults([])
        }
    }

    const handleProceed = () => {
        // If changing to sold, show confirm step first
        if (selectedStatus === 'sold' && selectedStatus !== property?.status) {
            setConfirmStep(true)
            return
        }
        handleSave()
    }

    const handleSave = async () => {
        if (!property || selectedStatus === property.status && !selectedLead) {
            onClose()
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/inventory/properties/${property.id}/status`, {
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

            toast.success(`Unit ${property.unit_number || property.title} marked as ${selectedStatus}`)

            if (onStatusChanged) {
                onStatusChanged(data.property, data.projectMetrics)
            }
            onClose()
        } catch (error) {
            console.error('Status update error:', error)
            toast.error(error.message || 'Failed to update property status')
        } finally {
            setLoading(false)
        }
    }

    if (!property) return null

    const currentStatusConfig = STATUS_OPTIONS.find(s => s.value === property.status)
    const isStatusChanged = selectedStatus !== property.status
    const needsLead = selectedStatus === 'reserved' || selectedStatus === 'sold'
    const existingLead = property?.leads?.[0]

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Change Unit Status
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-semibold text-foreground">{property.title}</span>
                        {property.configuration && <span className="text-muted-foreground"> · {property.configuration}</span>}
                        {property.size_sqft && <span className="text-muted-foreground"> · {property.size_sqft} sqft</span>}
                    </DialogDescription>
                </DialogHeader>

                {/* Sold Confirmation Step */}
                {confirmStep ? (
                    <div className="space-y-4 py-2">
                        <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
                            <ShieldCheck className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-semibold text-rose-800">Confirm Sale</p>
                                <p className="text-sm text-rose-700 mt-1">
                                    You are marking <strong>{property.title}</strong> as <strong>Sold</strong>.
                                    This action will update project metrics.
                                </p>
                            </div>
                        </div>

                        {selectedLead && (
                            <div className="p-4 bg-slate-50 rounded-xl border">
                                <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Sold To</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                                        <User className="w-5 h-5 text-rose-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground">{selectedLead.name}</p>
                                        {selectedLead.phone && <p className="text-xs text-muted-foreground">{selectedLead.phone}</p>}
                                        {selectedLead.email && <p className="text-xs text-muted-foreground">{selectedLead.email}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex gap-2">
                            <Button variant="outline" onClick={() => setConfirmStep(false)} disabled={loading}>
                                Back
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={loading}
                                className="bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                                Confirm Sale
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4 py-2">
                        {/* Current Status */}
                        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                            <span className="text-sm text-muted-foreground">Current:</span>
                            <Badge variant="outline" className={`${currentStatusConfig?.color} border font-semibold capitalize`}>
                                {currentStatusConfig?.label}
                            </Badge>
                            {existingLead && property.status !== 'available' && (
                                <div className="ml-auto flex items-center gap-1.5 text-sm text-muted-foreground">
                                    <User className="w-3.5 h-3.5" />
                                    <span className="font-medium text-foreground">{existingLead.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Status Options */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Select New Status:</label>
                            <div className="grid gap-2">
                                {STATUS_OPTIONS.map(option => {
                                    const Icon = option.icon
                                    return (
                                        <button
                                            key={option.value}
                                            onClick={() => handleStatusSelect(option.value)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${selectedStatus === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-border hover:border-blue-300 hover:bg-muted/50'
                                                }`}
                                        >
                                            <Icon className={`w-5 h-5 ${selectedStatus === option.value ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                            <span className={`font-medium ${selectedStatus === option.value ? 'text-blue-900' : 'text-foreground'}`}>
                                                {option.label}
                                            </span>
                                            {selectedStatus === option.value && (
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                                            )}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Lead Assignment — shown for reserved / sold */}
                        {needsLead && (
                            <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-foreground">
                                        {selectedStatus === 'sold' ? 'Buyer (Lead)' : 'Reserved By (Lead)'}
                                        <span className="text-muted-foreground font-normal ml-1">(optional)</span>
                                    </label>
                                    {selectedLead && (
                                        <button
                                            onClick={() => { setSelectedLead(null); setLeadSearch('') }}
                                            className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                                        >
                                            <XCircle className="w-3.5 h-3.5" /> Clear
                                        </button>
                                    )}
                                </div>

                                {/* Selected Lead Card */}
                                {selectedLead ? (
                                    <div className={`flex items-center gap-3 p-3 rounded-xl border-2 ${selectedStatus === 'sold' ? 'border-rose-300 bg-rose-50' : 'border-amber-300 bg-amber-50'}`}>
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold ${selectedStatus === 'sold' ? 'bg-rose-500' : 'bg-amber-500'}`}>
                                            {selectedLead.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm text-foreground truncate">{selectedLead.name}</p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                {selectedLead.phone && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="w-3 h-3" /> {selectedLead.phone}
                                                    </span>
                                                )}
                                                {selectedLead.email && (
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                                                        <Mail className="w-3 h-3" /> {selectedLead.email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <CheckCircle2 className={`w-5 h-5 shrink-0 ${selectedStatus === 'sold' ? 'text-rose-500' : 'text-amber-500'}`} />
                                    </div>
                                ) : (
                                    /* Lead Search */
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Search lead by name or phone..."
                                            value={leadSearch}
                                            onChange={e => setLeadSearch(e.target.value)}
                                        />
                                        {searchLoading && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                                        )}

                                        {/* Dropdown results */}
                                        {leadResults.length > 0 && (
                                            <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-xl shadow-lg overflow-hidden">
                                                {leadResults.map(lead => (
                                                    <button
                                                        key={lead.id}
                                                        onClick={() => { setSelectedLead(lead); setLeadResults([]); setLeadSearch('') }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors text-left"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                                                            {lead.name?.charAt(0)?.toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-medium text-sm text-foreground truncate">{lead.name}</p>
                                                            <p className="text-xs text-muted-foreground">{lead.phone || lead.email}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {leadSearch.length >= 2 && !searchLoading && leadResults.length === 0 && (
                                            <div className="absolute z-50 top-full mt-1 w-full bg-background border rounded-xl shadow-lg py-4 text-center text-sm text-muted-foreground">
                                                No leads found for &quot;{leadSearch}&quot;
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info warning about metrics */}
                        {isStatusChanged && property.project_id && (
                            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-blue-800">
                                    This will automatically update the project&apos;s unit counts.
                                </p>
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={onClose} disabled={loading}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleProceed}
                                disabled={loading || !isStatusChanged}
                                className={selectedStatus === 'sold' ? 'bg-rose-600 hover:bg-rose-700' : selectedStatus === 'reserved' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}
                            >
                                {loading
                                    ? <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    : null
                                }
                                {selectedStatus === 'sold' ? 'Mark as Sold →' : selectedStatus === 'reserved' ? 'Reserve Unit' : 'Mark Available'}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
