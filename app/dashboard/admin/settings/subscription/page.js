'use client'

import { useState, useEffect } from 'react'
import Script from 'next/script'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CreditCard, TrendingUp, Users, Zap, Calendar, Check, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SubscriptionPage() {
    const [subscription, setSubscription] = useState(null)
    const [usage, setUsage] = useState({})
    const [usagePercentages, setUsagePercentages] = useState({})
    const [limits, setLimits] = useState({})
    const [plans, setPlans] = useState([])
    const [loading, setLoading] = useState(true)
    const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState(null)
    const [mandateDialogOpen, setMandateDialogOpen] = useState(false)
    const [mandateData, setMandateData] = useState(null)
    const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false)

    useEffect(() => {
        fetchSubscription()
        fetchPlans()
    }, [])

    const fetchSubscription = async () => {
        try {
            const response = await fetch('/api/subscriptions/current')
            const data = await response.json()

            if (response.ok) {
                setSubscription(data.subscription)
                setUsage(data.usage)
                setUsagePercentages(data.usagePercentages)
                setLimits(data.limits)
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

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/subscriptions/plans')
            const data = await response.json()

            if (response.ok) {
                setPlans(data.plans || [])
            }
        } catch (error) {
            console.error('Error fetching plans:', error)
        }
    }

    const handleUpgrade = async (planSlug, billingCycle = 'monthly') => {
        // For free plan, use direct upgrade
        if (planSlug === 'free') {
            const loadingToast = toast.loading('Downgrading to Free plan...')

            try {
                const response = await fetch('/api/subscriptions/current?action=upgrade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ plan_slug: planSlug })
                })

                const data = await response.json()

                if (response.ok) {
                    toast.success('Downgraded to Free plan!', { id: loadingToast })
                    setUpgradeDialogOpen(false)
                    fetchSubscription()
                } else {
                    toast.error(data.error || 'Downgrade failed', { id: loadingToast })
                }
            } catch (error) {
                console.error('Error downgrading:', error)
                toast.error('Downgrade failed', { id: loadingToast })
            }
            return
        }

        // For paid plans, initiate Razorpay payment
        const loadingToast = toast.loading('Initiating payment...')

        try {
            // Check if Razorpay SDK is loaded
            if (!isRazorpayLoaded && !window.Razorpay) {
                toast.error('Payment gateway is still loading. Please try again in 3 seconds.', { id: loadingToast })
                return
            }

            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_slug: planSlug, billing_cycle: billingCycle })
            })

            const data = await response.json()

            if (!response.ok) {
                toast.error(data.error || 'Payment initiation failed', { id: loadingToast })
                return
            }

            toast.dismiss(loadingToast)

            // Check if simulation mode - show mandate dialog
            if (data.is_simulation) {
                setMandateData({
                    invoice_id: data.invoice_id,
                    plan_slug: planSlug,
                    billing_cycle: billingCycle,
                    amount: data.amount,
                    plan_name: plans.find(p => p.slug === planSlug)?.name
                })
                setUpgradeDialogOpen(false)
                setMandateDialogOpen(true)
                return
            }

            // Real Payment Flow using Window.Razorpay
            const isTestMode = data.key?.startsWith('rzp_test')
            if (isTestMode) {
                toast('💳 Test Mode Verified', {
                    icon: '🧪',
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                })
            }

            const options = {
                key: data.key,
                amount: data.amount * 100,
                currency: data.currency,
                name: data.name,
                description: data.description,
                order_id: data.order_id,
                prefill: data.prefill,
                theme: data.theme,
                handler: function (response) {
                    toast.success('Payment successful! Verifying subscription...')
                    setUpgradeDialogOpen(false)
                    // Wait 2s for webhook to process
                    setTimeout(() => {
                        fetchSubscription()
                        toast.success('Subscription upgraded!')
                    }, 2000)
                },
                modal: {
                    ondismiss: function () {
                        toast.error('Payment cancelled')
                    }
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()

        } catch (error) {
            console.error('Error initiating payment:', error)
            toast.error('Payment initiation failed', { id: loadingToast })
        }
    }

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
            return
        }

        const loadingToast = toast.loading('Cancelling subscription...')

        try {
            const response = await fetch('/api/subscriptions/current?action=cancel', {
                method: 'POST'
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('Subscription cancelled', { id: loadingToast })
                fetchSubscription()
            } else {
                toast.error(data.error || 'Cancellation failed', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error cancelling:', error)
            toast.error('Cancellation failed', { id: loadingToast })
        }
    }

    const getStatusBadge = (status) => {
        const variants = {
            active: 'bg-green-100 text-green-800',
            trialing: 'bg-blue-100 text-blue-800',
            cancelled: 'bg-red-100 text-red-800',
            past_due: 'bg-yellow-100 text-yellow-800'
        }
        return <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>{status}</Badge>
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const getUsageColor = (percentage) => {
        if (percentage >= 90) return 'bg-red-500'
        if (percentage >= 75) return 'bg-yellow-500'
        return 'bg-green-500'
    }

    const handleConfirmMandate = async () => {
        if (!mandateData) return

        const loadingToast = toast.loading('Confirming payment mandate...')

        try {
            const response = await fetch('/api/payment/mandate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(mandateData)
            })

            const data = await response.json()

            if (response.ok) {
                toast.success('✅ Payment mandate confirmed! Subscription activated.', { id: loadingToast })
                setMandateDialogOpen(false)
                setMandateData(null)
                fetchSubscription()
            } else {
                toast.error(data.error || 'Mandate confirmation failed', { id: loadingToast })
            }
        } catch (error) {
            console.error('Error confirming mandate:', error)
            toast.error('Mandate confirmation failed', { id: loadingToast })
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-pulse">Loading subscription...</div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Subscription & Billing</h1>
                <p className="text-gray-500 mt-1">Manage your subscription and view usage</p>
            </div>

            {/* Current Plan */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl">{subscription?.plan?.name || 'No Plan'}</CardTitle>
                            <CardDescription>{subscription?.plan?.description}</CardDescription>
                        </div>
                        <div className="text-right">
                            {getStatusBadge(subscription?.status)}
                            {subscription?.status === 'trialing' && subscription?.trial_ends_at && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Trial ends {formatDate(subscription.trial_ends_at)}
                                </p>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <p className="text-sm text-gray-600">Billing Cycle</p>
                            <p className="text-lg font-semibold capitalize">{subscription?.billing_cycle || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="text-lg font-semibold">
                                {subscription?.billing_cycle === 'monthly'
                                    ? formatCurrency(subscription?.plan?.price_monthly || 0)
                                    : formatCurrency(subscription?.plan?.price_yearly || 0)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Next Billing Date</p>
                            <p className="text-lg font-semibold">
                                {subscription?.current_period_end ? formatDate(subscription.current_period_end) : 'N/A'}
                            </p>
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div className="flex gap-3">
                        <Button onClick={() => setUpgradeDialogOpen(true)} className="flex-1">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Upgrade Plan
                        </Button>
                        {subscription?.status === 'active' && !subscription?.cancel_at_period_end && (
                            <Button variant="outline" onClick={handleCancel} className="flex-1">
                                <X className="w-4 h-4 mr-2" />
                                Cancel Subscription
                            </Button>
                        )}
                    </div>

                    {subscription?.cancel_at_period_end && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm text-yellow-800">
                                Your subscription will be cancelled at the end of the current billing period ({formatDate(subscription.current_period_end)})
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Usage Meters */}
            <Card>
                <CardHeader>
                    <CardTitle>Current Usage</CardTitle>
                    <CardDescription>Track your usage against plan limits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* AI Calls */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Zap className="w-5 h-5 text-blue-500" />
                                <span className="font-medium">AI Calls</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                {usage.ai_calls || 0} / {limits.ai_calls === -1 ? '∞' : limits.ai_calls}
                            </span>
                        </div>
                        <Progress
                            value={limits.ai_calls === -1 ? 0 : usagePercentages.ai_calls || 0}
                            className="h-2"
                        />
                        {usagePercentages.ai_calls >= 90 && limits.ai_calls !== -1 && (
                            <p className="text-xs text-red-600 mt-1">You're approaching your limit!</p>
                        )}
                    </div>

                    {/* Users */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-green-500" />
                                <span className="font-medium">Team Members</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                {usage.users || 0} / {limits.users === -1 ? '∞' : limits.users}
                            </span>
                        </div>
                        <Progress
                            value={limits.users === -1 ? 0 : usagePercentages.users || 0}
                            className="h-2"
                        />
                    </div>

                    {/* Projects */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-500" />
                                <span className="font-medium">Projects</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                {usage.projects || 0} / {limits.projects === -1 ? '∞' : limits.projects}
                            </span>
                        </div>
                        <Progress
                            value={limits.projects === -1 ? 0 : usagePercentages.projects || 0}
                            className="h-2"
                        />
                    </div>

                    {/* Campaigns */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-orange-500" />
                                <span className="font-medium">Campaigns</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                {usage.campaigns || 0} / {limits.campaigns === -1 ? '∞' : limits.campaigns}
                            </span>
                        </div>
                        <Progress
                            value={limits.campaigns === -1 ? 0 : usagePercentages.campaigns || 0}
                            className="h-2"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Upgrade Dialog */}
            <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Choose a Plan</DialogTitle>
                        <DialogDescription>Select the plan that best fits your needs</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {plans.map((plan) => (
                            <Card
                                key={plan.id}
                                className={`cursor-pointer transition-all ${selectedPlan?.id === plan.id ? 'ring-2 ring-blue-500' : ''
                                    } ${subscription?.plan?.id === plan.id ? 'border-blue-500 border-2' : ''}`}
                                onClick={() => setSelectedPlan(plan)}
                            >
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        {plan.name}
                                        {subscription?.plan?.id === plan.id && (
                                            <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                                        )}
                                    </CardTitle>
                                    <CardDescription>{plan.description}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold mb-4">
                                        {plan.features.custom_pricing ? 'Custom' : formatCurrency(plan.price_monthly)}
                                        {!plan.features.custom_pricing && <span className="text-sm font-normal text-gray-500">/month</span>}
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>{plan.features.ai_calls_per_month === -1 ? 'Unlimited' : plan.features.ai_calls_per_month} AI calls/month</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>{plan.features.max_users === -1 ? 'Unlimited' : plan.features.max_users} team members</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>{plan.features.max_projects === -1 ? 'Unlimited' : plan.features.max_projects} projects</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Check className="w-4 h-4 text-green-500" />
                                            <span>{plan.features.max_campaigns === -1 ? 'Unlimited' : plan.features.max_campaigns} campaigns</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => selectedPlan && handleUpgrade(selectedPlan.slug)}
                            disabled={!selectedPlan || selectedPlan.id === subscription?.plan?.id}
                        >
                            {selectedPlan?.features.custom_pricing ? 'Contact Sales' : 'Upgrade Now'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Mandate Confirmation Dialog */}
            <Dialog open={mandateDialogOpen} onOpenChange={setMandateDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Payment Mandate</DialogTitle>
                        <DialogDescription>
                            Authorize recurring payments for your subscription
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">Payment Authorization</h4>
                            <p className="text-sm text-blue-800">
                                You are authorizing automatic recurring payments for the <strong>{mandateData?.plan_name}</strong> plan.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Plan:</span>
                                <span className="font-semibold">{mandateData?.plan_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Amount:</span>
                                <span className="font-semibold">{formatCurrency(mandateData?.amount || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Billing Cycle:</span>
                                <span className="font-semibold capitalize">{mandateData?.billing_cycle}</span>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <p className="text-xs text-yellow-800">
                                ⚠️ By confirming, you authorize us to automatically charge your payment method on each billing cycle.
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setMandateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmMandate}>
                            Confirm Mandate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Razorpay SDK Script */}
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
                onLoad={() => setIsRazorpayLoaded(true)}
                onError={() => toast.error("Failed to load Razorpay SDK. Please check your internet connection.")}
            />
        </div>
    )
}
