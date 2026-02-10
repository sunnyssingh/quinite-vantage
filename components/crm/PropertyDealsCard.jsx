'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, DollarSign, Home, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import AddDealDialog from './AddDealDialog'

export default function PropertyDealsCard({ deals = [], leadId, onUpdate, currency = 'USD', defaultProperty, defaultProject }) {
    const [isAddDealOpen, setIsAddDealOpen] = useState(false)

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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 0
        }).format(amount || 0)
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'won':
            case 'closed':
            case 'closed won':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'lost':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'active':
            case 'in_progress':
            case 'negotiation':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
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
                            {/* Total Value Summary */}
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                                <div className="flex items-center gap-2 mb-1">
                                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                                    <span className="text-xs font-medium text-emerald-700">Total Value</span>
                                </div>
                                <p className="text-lg font-bold text-emerald-900">{formatCurrency(totalValue)}</p>
                            </div>

                            {/* Deals List */}
                            <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                {deals.map((deal, index) => (
                                    <div
                                        key={deal.id || index}
                                        className="group p-2.5 rounded-lg border border-transparent hover:border-emerald-100 hover:shadow-sm transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                <Home className="w-3.5 h-3.5 text-gray-400 shrink-0 group-hover:text-emerald-500 transition-colors" />
                                                <span className="text-sm font-medium text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                                                    {deal.property ? `${deal.property.title}${deal.property.project ? ` (${deal.property.project.name})` : ''}` : (deal.project?.name || deal.name || `Deal #${index + 1}`)}
                                                </span>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={`text-[10px] px-1.5 py-0 h-5 shrink-0 uppercase tracking-wide border-0 ${getStatusColor(deal.status)}`}
                                            >
                                                {deal.status || 'Active'}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between pl-5.5">
                                            <span className="text-xs font-semibold text-gray-900">
                                                {formatCurrency(deal.amount)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                {deal.created_at && (
                                                    <span className="text-[10px] text-gray-400">
                                                        {new Date(deal.created_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric'
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
                                ))}
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
                            <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">Track property deals and transactions for this lead</p>
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
