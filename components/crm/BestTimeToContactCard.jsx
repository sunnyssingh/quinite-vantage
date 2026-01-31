'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function BestTimeToContactCard({ profile }) {
    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Best Time to Contact</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Best time for</span>
                    <span className="text-sm font-medium text-blue-500">Today</span>
                </div>
                <div className="mt-4 text-center py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded text-sm font-medium">
                    {profile.best_contact_time || 'Not specified'}
                </div>
            </CardContent>
        </Card>
    )
}
