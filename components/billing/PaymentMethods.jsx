'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Plus, Trash2, CheckCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function PaymentMethods() {
    const [methods, setMethods] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchPaymentMethods()
    }, [])

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true)
            const res = await fetch('/api/billing/payment-methods')
            const data = await res.json()
            setMethods(data.methods || [])
        } catch (error) {
            console.error('Error fetching payment methods:', error)
            toast.error('Failed to load payment methods')
        } finally {
            setLoading(false)
        }
    }

    const handleAddMethod = async () => {
        try {
            // Create Razorpay order for card verification (₹1 authorization)
            const res = await fetch('/api/billing/payment-methods/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Failed to initiate card addition')
            }

            // Initialize Razorpay
            const options = {
                key: data.key_id,
                amount: data.order.amount,
                currency: 'INR',
                name: 'Quinite Vantage',
                description: 'Add Payment Method',
                order_id: data.order.id,
                handler: async function (response) {
                    // Verify and save card
                    const verifyRes = await fetch('/api/billing/payment-methods/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    })

                    if (verifyRes.ok) {
                        toast.success('Payment method added successfully')
                        fetchPaymentMethods()
                    } else {
                        toast.error('Failed to verify payment method')
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#2563eb'
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {
            console.error('Error adding payment method:', error)
            toast.error(error.message || 'Failed to add payment method')
        }
    }

    const handleSetDefault = async (methodId) => {
        try {
            const res = await fetch(`/api/billing/payment-methods/${methodId}/default`, {
                method: 'POST'
            })

            if (res.ok) {
                toast.success('Default payment method updated')
                fetchPaymentMethods()
            } else {
                toast.error('Failed to update default method')
            }
        } catch (error) {
            console.error('Error setting default:', error)
            toast.error('Error updating default method')
        }
    }

    const handleDelete = async (methodId) => {
        if (!confirm('Are you sure you want to remove this payment method?')) return

        try {
            const res = await fetch(`/api/billing/payment-methods/${methodId}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                toast.success('Payment method removed')
                fetchPaymentMethods()
            } else {
                toast.error('Failed to remove payment method')
            }
        } catch (error) {
            console.error('Error deleting method:', error)
            toast.error('Error removing payment method')
        }
    }

    const getCardBrand = (brand) => {
        const brands = {
            visa: 'Visa',
            mastercard: 'Mastercard',
            amex: 'American Express',
            rupay: 'RuPay'
        }
        return brands[brand?.toLowerCase()] || brand
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Manage your saved payment methods</CardDescription>
                    </div>
                    <Button onClick={handleAddMethod}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Card
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {methods.length === 0 ? (
                    <div className="text-center py-12">
                        <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No payment methods saved</p>
                        <Button onClick={handleAddMethod} variant="outline" className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Your First Card
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {methods.map((method) => (
                            <div
                                key={method.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-100 rounded">
                                        <CreditCard className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">
                                                {getCardBrand(method.card_brand)} •••• {method.last4}
                                            </p>
                                            {method.is_default && (
                                                <Badge variant="default" className="text-xs">
                                                    <CheckCircle className="mr-1 h-3 w-3" />
                                                    Default
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            Expires {method.expiry_month}/{method.expiry_year}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!method.is_default && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleSetDefault(method.id)}
                                        >
                                            Set Default
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleDelete(method.id)}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Razorpay script */}
                <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </CardContent>
        </Card>
    )
}
