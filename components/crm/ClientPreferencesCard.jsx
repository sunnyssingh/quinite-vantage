'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star } from 'lucide-react'

export default function ClientPreferencesCard({ profile }) {
    const formatCurrency = (amount) => {
        if (!amount) return 'N/A'
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(amount)
    }

    return (
        <Card className="h-full">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
                <Star className="w-5 h-5 text-foreground fill-foreground" />
                <CardTitle className="text-base font-semibold">Client Preferences</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Location Preference</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {profile.location || 'Any'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Associated Properties</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {profile.project?.name || 'None'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Property Type Interested In</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {profile.property_type_interest || 'Any'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground mb-1">Sub-category</p>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            {profile.sub_category_interest || 'Any'}
                        </p>
                    </div>

                    <div className="col-span-2 grid grid-cols-2 gap-8 mt-2">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Min Budget</p>
                            <p className="text-base font-semibold text-orange-500">
                                {formatCurrency(profile.min_budget)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Max Budget</p>
                            <p className="text-base font-semibold text-orange-500">
                                {formatCurrency(profile.max_budget)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
