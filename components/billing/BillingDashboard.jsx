'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Users, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import CreditPurchase from './CreditPurchase'
import InvoiceList from './InvoiceList'
import PaymentMethods from './PaymentMethods'

export default function BillingDashboard() {
    const [subscription, setSubscription] = useState(null)
    const [credits, setCredits] = useState(null)
    const [invoices, setInvoices] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBillingData()
    }, [])

    const fetchBillingData = async () => {
        try {
            setLoading(true)

            // Fetch subscription
            const subRes = await fetch('/api/billing/subscription')
            const subData = await subRes.json()
            setSubscription(subData)

            // Fetch credits
            const creditsRes = await fetch('/api/billing/credits')
            const creditsData = await creditsRes.json()
            setCredits(creditsData)

            // Fetch invoices
            const invoicesRes = await fetch('/api/billing/invoices?limit=10')
            const invoicesData = await invoicesRes.json()
            setInvoices(invoicesData.invoices || [])
        } catch (error) {
            console.error('Error fetching billing data:', error)
            toast.error('Failed to load billing information')
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status) => {
        const statusConfig = {
            active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
            suspended: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Suspended' },
            trial: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, label: 'Trial' },
            cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' }
        }

        const config = statusConfig[status] || statusConfig.active
        const Icon = config.icon

        return (
            <Badge className={`${config.color} flex items-center gap-1`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </Badge>
        )
    }

    const getInvoiceStatusBadge = (status) => {
        const colors = {
            paid: 'bg-green-100 text-green-800',
            issued: 'bg-blue-100 text-blue-800',
            overdue: 'bg-red-100 text-red-800',
            draft: 'bg-gray-100 text-gray-800'
        }

        return (
            <Badge className={colors[status] || colors.draft}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Subscription Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Subscription Status</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {subscription?.subscription ? (
                                <>
                                    {getStatusBadge(subscription.subscription.status)}
                                    <p className="text-2xl font-bold">{subscription.subscription.plan?.name || 'N/A'}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {subscription.subscription.billing_cycle === 'monthly' ? 'Monthly' : 'Annual'} billing
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-muted-foreground">No active subscription</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold">{subscription?.subscription?.user_count || 0}</p>
                            <p className="text-xs text-muted-foreground">
                                ₹{subscription?.subscription?.plan?.per_user_price_inr || 0} per user/month
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Call Credits</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-2xl font-bold">{credits?.balance?.toFixed(2) || '0.00'}</p>
                            <p className="text-xs text-muted-foreground">
                                {credits?.lowBalance && (
                                    <span className="text-orange-600 font-medium">Low balance - Recharge soon</span>
                                )}
                                {!credits?.lowBalance && 'Sufficient balance'}
                            </p>
                            <Button size="sm" className="mt-2 w-full">
                                Purchase Credits
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Account Status Alert */}
            {subscription?.status?.isLocked && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-800 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5" />
                            Account Suspended
                        </CardTitle>
                        <CardDescription className="text-red-700">
                            {subscription.status.reason}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive">Pay Outstanding Invoices</Button>
                    </CardContent>
                </Card>
            )}

            {/* Credit Purchase */}
            <CreditPurchase
                currentBalance={credits?.balance}
                onPurchaseComplete={fetchBillingData}
            />

            {/* Invoice History */}
            <InvoiceList invoices={invoices} onRefresh={fetchBillingData} />

            {/* Payment Methods */}
            <PaymentMethods />

            {/* Next Billing Date */}
            {subscription?.subscription?.next_billing_date && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Next Billing Date</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg font-semibold">
                            {new Date(subscription.subscription.next_billing_date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
