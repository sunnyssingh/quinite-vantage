'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, DollarSign, Home, Trash2, ChevronDown, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'react-hot-toast'
import AddDealDialog from './AddDealDialog'

const DEAL_STATUSES = [
    { value: 'active', label: 'Active', icon: Clock, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'negotiation', label: 'Negotiation', icon: Clock, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'won', label: 'Closed Won ✓', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'lost', label: 'Closed Lost ✗', icon: XCircle, color: 'bg-red-100 text-red-700 border-red-200' },
]

function getDealStatusConfig(status) {
    const s = (status || '').toLowerCase()
    if (s === 'won' || s === 'closed' || s === 'closed won')
        return { label: 'Won', color: 'bg-green-100 text-green-700 border-green-200' }
    if (s === 'lost')
        return { label: 'Lost', color: 'bg-red-100 text-red-700 border-red-200' }
    if (s === 'negotiation')
        return { label: 'Negotiating', color: 'bg-purple-100 text-purple-700 border-purple-200' }
    return { label: status || 'Active', color: 'bg-blue-100 text-blue-700 border-blue-200' }
}

export default function PropertyDealsCard({ deals = [], leadId, onUpdate, currency = 'INR', defaultProperty, defaultProject }) {
    const [isAddDealOpen, setIsAddDealOpen] = useState(false)
    const [updatingDealId, setUpdatingDealId] = useState(null)

    const handleDelete = async (dealId) => {
        if (!confirm('Are you sure you want to delete this deal?')) return
        try {
            const res = await fetch(`/api/deals/${dealId}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Failed to delete deal')
            toast.success('Deal deleted')
            if (onUpdate) onUpdate()
        } catch (error) {
            toast.error('Failed to delete deal')
            console.error(error)
        }
    }

    const handleStatusChange = async (dealId, newStatus) => {
        setUpdatingDealId(dealId)
        try {
            const res = await fetch(`/api/deals/${dealId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Failed to update deal')
            }

            const statusLabel = DEAL_STATUSES.find(s => s.value === newStatus)?.label || newStatus
            toast.success(`Deal marked as ${statusLabel}`)

            // Also update inventory display
            if (onUpdate) onUpdate()
        } catch (error) {
            toast.error(error.message || 'Failed to update deal status')
            console.error(error)
        } finally {
            setUpdatingDealId(null)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0)

    return (
        <>
            <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                            <TrendingUp className="w-4 h-4" />
                        </div>
                        <CardTitle className="text-sm font-semibold text-gray-900">Property Deals</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium">
                            {deals.length}
                        </Badge>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-emerald-50 hover:text-emerald-600 rounded-full"
                            onClick={() => setIsAddDealOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {deals.length > 0 ? (
                        <div className="space-y-3">
                            {/* Total Value */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-xs font-medium text-emerald-700">Total Value</span>
                                </div>
                                <p className="text-lg font-bold text-emerald-900">{formatCurrency(totalValue)}</p>
                            </div>

                            {/* Deals List */}
                            <div className="space-y-2 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                {deals.map((deal, index) => {
                                    const statusConfig = getDealStatusConfig(deal.status)
                                    const isUpdating = updatingDealId === deal.id
                                    return (
                                        <div
                                            key={deal.id || index}
                                            className="group p-2.5 rounded-lg border border-transparent hover:border-emerald-100 hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                                    <Home className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                                    <span className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                                                        {deal.property
                                                            ? `${deal.property.title}${deal.property.project ? ` (${deal.property.project.name})` : ''}`
                                                            : (deal.project?.name || deal.name || `Deal #${index + 1}`)
                                                        }
                                                    </span>
                                                </div>

                                                {/* Status dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            disabled={isUpdating}
                                                            className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border font-semibold uppercase tracking-wide transition-all hover:opacity-80 ${statusConfig.color} ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                                        >
                                                            {isUpdating ? '...' : statusConfig.label}
                                                            <ChevronDown className="w-2.5 h-2.5" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <div className="px-2 py-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                                                            Change Status
                                                        </div>
                                                        <DropdownMenuSeparator />
                                                        {DEAL_STATUSES.map(opt => {
                                                            const Icon = opt.icon
                                                            return (
                                                                <DropdownMenuItem
                                                                    key={opt.value}
                                                                    onClick={() => handleStatusChange(deal.id, opt.value)}
                                                                    className="gap-2 cursor-pointer"
                                                                >
                                                                    <Icon className="w-3.5 h-3.5" />
                                                                    {opt.label}
                                                                </DropdownMenuItem>
                                                            )
                                                        })}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>

                                            <div className="flex items-center justify-between pl-5">
                                                <span className="text-xs font-semibold text-gray-900">
                                                    {formatCurrency(deal.amount)}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {deal.created_at && (
                                                        <span className="text-[10px] text-gray-400">
                                                            {new Date(deal.created_at).toLocaleDateString('en-IN', {
                                                                month: 'short', day: 'numeric'
                                                            })}
                                                        </span>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDelete(deal.id)
                                                        }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-xs h-8 border-dashed text-muted-foreground hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50"
                                onClick={() => setIsAddDealOpen(true)}
                            >
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Add Another Deal
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No deals yet</p>
                            <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">Creating a deal will automatically reserve the unit in inventory</p>
                            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setIsAddDealOpen(true)}>
                                <Plus className="w-3 h-3 mr-1" />
                                Add Deal
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AddDealDialog
                leadId={leadId}
                isOpen={isAddDealOpen}
                onClose={() => setIsAddDealOpen(false)}
                onSuccess={onUpdate}
                defaultProperty={defaultProperty}
                defaultProject={defaultProject}
            />
        </>
    )
}
