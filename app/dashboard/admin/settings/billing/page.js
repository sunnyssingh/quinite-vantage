'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BillingPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to new subscription page
        router.replace('/dashboard/admin/settings/subscription')
    }, [router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse">Redirecting to subscription page...</div>
        </div>
    )
}
