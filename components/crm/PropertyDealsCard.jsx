'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp } from 'lucide-react'
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
        <Card className="h-full border-0 shadow-sm ring-1 ring-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                        <TrendingUp className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-sm font-semibold text-gray-900">Property Deals</CardTitle>
                    <Badge variant="secondary" className="rounded-sm px-1.5 py-0 text-xs text-muted-foreground">
                        {deals.length}
                    </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400">
                    <Plus className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-10 text-muted-foreground h-full min-h-[150px]">
                    <p className="text-lg font-semibold mb-2">Coming Soon 🚀</p>
                    <p className="text-sm text-center px-4">This feature is currently under development.</p>
                </div>
            </CardContent>
        </Card>
    )
}
