'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import PricingTiers from '@/components/subscription/PricingTiers'
import UsageLimits from '@/components/dashboard/UsageLimits'
import CreditPurchase from '@/components/billing/CreditPurchase'

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState(null)
    const [organization, setOrganization] = useState(null)
    const [credits, setCredits] = useState(null)
    const [loading, setLoading] = useState(true)
    const [organizationId, setOrganizationId] = useState(null)

    useEffect(() => {
        fetchSubscription()
        fetchOrganization()
        fetchCredits()
    }, [])

    const fetchOrganization = async () => {
        try {
            const response = await fetch('/api/organization/settings')
            const data = await response.json()

            if (response.ok) {
                setOrganization(data.organization)
            }
        } catch (error) {
            console.error('Error fetching organization:', error)
        }
    }

    const fetchCredits = async () => {
        try {
            const response = await fetch('/api/billing/credits')
            const data = await response.json()
            if (response.ok) {
                setCredits(data)
            }
        } catch (error) {
            console.error('Error fetching credits:', error)
        }
    }

    const fetchSubscription = async () => {
        try {
            const response = await fetch('/api/subscriptions/current')
            const data = await response.json()

            if (response.ok) {
                setSubscription(data.subscription)
                setOrganizationId(data.subscription?.organization_id)
            } else {
                toast.error(data.error || 'Failed to fetch subscription')
            }
        } catch (error) {
            console.error('Error fetching subscription:', error)
            toast.error('Failed to fetch subscription')
        } finally {
            setLoading(false)
        }
    }

    const handleUpgrade = async (planId) => {
        const loadingToast = toast.loading('Processing upgrade...')

        try {
            const response = await fetch('/api/subscriptions/current?action=upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Subscription updated successfully!', { id: loadingToast })
                fetchSubscription()
            } else {
                toast.error(data.error || 'Upgrade failed', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error upgrading:', error)
            toast.error('Upgrade failed', { id: loadingToast })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading subscription...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen h-full bg-gradient-to-br from-gray-50 to-blue-50 overflow-y-auto">
            <div className="container mx-auto py-8 px-4 max-w-7xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
                    <p className="text-gray-600 mt-2">
                        Manage your subscription plan and view usage statistics
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2">
                        {/* Current Plan Card */}
                        <Card className="mb-6">
                            <CardHeader>
                                <CardTitle>Current Plan</CardTitle>
                                <CardDescription>Your active subscription details</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {subscription ? (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {subscription.plan?.name || 'Free'}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {subscription.plan?.description}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                {subscription.plan?.per_user_price_inr > 0 ? (
                                                    <>
                                                        <div className="text-2xl font-bold text-blue-600">
                                                            {organization?.currency_symbol || '₹'}{subscription.plan.per_user_price_inr}
                                                        </div>
                                                        <div className="text-sm text-gray-500">per user/month</div>
                                                    </>
                                                ) : (
                                                    <div className="text-2xl font-bold text-green-600">Free</div>
                                                )}
                                            </div>
                                        </div>

                                        {subscription.user_count && subscription.plan?.per_user_price_inr > 0 && (
                                            <div className="pt-4 border-t">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-gray-600">
                                                        {subscription.user_count} user{subscription.user_count > 1 ? 's' : ''}
                                                    </span>
                                                    <span className="text-xl font-semibold text-gray-900">
                                                        {organization?.currency_symbol || '₹'}{(subscription.plan.per_user_price_inr * subscription.user_count).toFixed(0)}/month
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No active subscription</p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Usage Limits Sidebar */}
                    <div>
                        {organizationId && <UsageLimits organizationId={organizationId} />}
                    </div>
                </div>

                {/* Pricing Tiers - Full Width */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Plans</h2>
                    <PricingTiers
                        currentPlan={subscription?.plan?.name}
                        onUpgrade={handleUpgrade}
                        organizationCurrency={organization?.currency}
                        organizationCurrencySymbol={organization?.currency_symbol}
                    />
                </div>

                {/* Call Credits Section */}
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Call Credits</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <CreditPurchase
                            currentBalance={credits?.balance}
                            onPurchaseComplete={fetchCredits}
                        />
                        {/* We could add logic here to show transaction history if needed, but keeping it simple for now */}
                    </div>
                </div>
            </div>
        </div>
    )
}
