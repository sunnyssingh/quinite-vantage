/**
 * Feature Gating Hook
 * Use this hook to check if a feature is available in the current subscription
 */

import { useState, useEffect } from 'react'
import { checkFeatureAccess } from '@/lib/middleware/subscription'

export function useFeatureAccess(feature) {
    const [hasAccess, setHasAccess] = useState(false)
    const [loading, setLoading] = useState(true)
    const [reason, setReason] = useState(null)

    useEffect(() => {
        checkAccess()
    }, [feature])

    const checkAccess = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/billing/feature-access?feature=${feature}`)
            const data = await res.json()

            setHasAccess(data.hasAccess)
            setReason(data.reason)
        } catch (error) {
            console.error('Error checking feature access:', error)
            setHasAccess(false)
        } finally {
            setLoading(false)
        }
    }

    return { hasAccess, loading, reason, refresh: checkAccess }
}

/**
 * Feature Gate Component
 * Wraps content that should only be visible to users with access
 */
export function FeatureGate({ feature, children, fallback = null, showUpgrade = true }) {
    const { hasAccess, loading, reason } = useFeatureAccess(feature)

    if (loading) {
        return null
    }

    if (!hasAccess) {
        if (showUpgrade) {
            return (
                <div className="p-4 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                            <svg className="h-10 w-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-sm font-semibold text-blue-900">Pro Feature</h3>
                            <p className="text-sm text-blue-700 mt-1">{reason || 'This feature requires a Pro subscription'}</p>
                            <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline">
                                Upgrade to Pro →
                            </button>
                        </div>
                    </div>
                </div>
            )
        }
        return fallback
    }

    return children
}
