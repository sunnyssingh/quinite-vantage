'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, DollarSign, Home } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function PropertyDealsCard({ deals = [], currency = 'USD' }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount || 0)
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'won':
            case 'closed':
                return 'bg-green-100 text-green-700 border-green-200'
            case 'lost':
                return 'bg-red-100 text-red-700 border-red-200'
            case 'active':
            case 'in_progress':
                return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'pending':
                return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            default:
                return 'bg-gray-100 text-gray-700 border-gray-200'
        }
    }

    const totalValue = deals.reduce((sum, deal) => sum + (deal.amount || 0), 0)

    return (
        <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-900">Property Deals</CardTitle>
                </div>
                <Badge variant="secondary" className="px-1.5 py-0 h-5 text-[10px] font-medium">
                    {deals.length}
                </Badge>
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
                                    className="group p-2.5 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <Home className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                            <span className="text-sm font-medium text-gray-900 truncate">
                                                {deal.property_name || deal.title || `Deal #${index + 1}`}
                                            </span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] px-1.5 py-0 h-5 shrink-0 ${getStatusColor(deal.status)}`}
                                        >
                                            {deal.status || 'Active'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-gray-900">
                                            {formatCurrency(deal.amount)}
                                        </span>
                                        {deal.created_at && (
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(deal.created_at).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                            <TrendingUp className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1">No deals yet</p>
                        <p className="text-xs text-gray-500 mb-3">Track property deals and transactions</p>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Plus className="w-3 h-3 mr-1" />
                            Add Deal
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
