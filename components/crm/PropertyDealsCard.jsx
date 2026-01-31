'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function PropertyDealsCard({ deals = [] }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const getStageColor = (stage) => {
        switch (stage?.toLowerCase()) {
            case 'won': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'lost': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            case 'negotiation': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
            case 'qualified': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-semibold">Property Deals</CardTitle>
                    <Badge variant="secondary" className="rounded-sm px-1.5 py-0 text-xs text-muted-foreground">
                        {deals.length}
                    </Badge>
                </div>
                <Button variant="outline" size="icon" className="h-8 w-8">
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                {deals.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No active deals
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deals.map((deal) => (
                            <div key={deal.id} className="pb-4 border-b last:border-0 last:pb-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className="text-sm font-semibold text-primary">{deal.name}</h4>
                                </div>
                                <div className="text-lg font-bold text-orange-500 mb-2">
                                    {formatCurrency(deal.amount || 0)}
                                </div>
                                <div className="flex items-center gap-4 text-xs">
                                    <Badge variant="secondary" className={getStageColor(deal.stage)}>
                                        Stage: {deal.stage || 'New'}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                        Probability: {deal.probability || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
