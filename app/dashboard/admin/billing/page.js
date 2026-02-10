'use client'

import { Suspense } from 'react'
import BillingDashboard from '@/components/billing/BillingDashboard'

export default function BillingPage() {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your subscription, credits, and invoices
                    </p>
                </div>
            </div>

            <Suspense fallback={
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            }>
                <BillingDashboard />
            </Suspense>
        </div>
    )
}
