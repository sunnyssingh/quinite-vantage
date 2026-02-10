'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function CreditPurchase({ currentBalance, onPurchaseComplete }) {
    const [credits, setCredits] = useState(100)
    const [loading, setLoading] = useState(false)

    const CREDIT_RATE = 4 // 4 Rupees = 1 Credit

    const calculateAmount = () => {
        return credits * CREDIT_RATE
    }

    const handlePurchase = async () => {
        try {
            setLoading(true)

            // Create Razorpay order
            const orderRes = await fetch('/api/billing/payment/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: calculateAmount(),
                    credits,
                    type: 'credit_purchase'
                })
            })

            const orderData = await orderRes.json()

            if (!orderRes.ok) {
                throw new Error(orderData.error || 'Failed to create order')
            }

            // Initialize Razorpay
            const options = {
                key: orderData.key_id,
                amount: orderData.order.amount,
                currency: 'INR',
                name: 'Quinite Vantage',
                description: `Purchase ${credits} Call Credits`,
                order_id: orderData.order.id,
                handler: async function (response) {
                    // Verify payment
                    const verifyRes = await fetch('/api/billing/payment/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    })

                    const verifyData = await verifyRes.json()

                    if (verifyRes.ok && verifyData.success) {
                        toast.success(`Successfully purchased ${credits} credits!`)
                        if (onPurchaseComplete) {
                            onPurchaseComplete()
                        }
                    } else {
                        toast.error('Payment verification failed')
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: ''
                },
                theme: {
                    color: '#2563eb'
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false)
                    }
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error) {
            console.error('Error purchasing credits:', error)
            toast.error(error.message || 'Failed to initiate payment')
            setLoading(false)
        }
    }

    const presetAmounts = [50, 100, 250, 500, 1000]

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Purchase Call Credits
                </CardTitle>
                <CardDescription>
                    Current Balance: <span className="font-semibold">{currentBalance?.toFixed(2) || '0.00'}</span> credits
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Preset amounts */}
                <div className="space-y-2">
                    <Label>Quick Select</Label>
                    <div className="grid grid-cols-5 gap-2">
                        {presetAmounts.map((amount) => (
                            <Button
                                key={amount}
                                variant={credits === amount ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCredits(amount)}
                                className="text-xs"
                            >
                                {amount}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Custom amount */}
                <div className="space-y-2">
                    <Label htmlFor="credits">Custom Amount (Credits)</Label>
                    <Input
                        id="credits"
                        type="number"
                        min="1"
                        value={credits}
                        onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                        placeholder="Enter credits"
                    />
                    <p className="text-xs text-muted-foreground">
                        1 Credit = 1 Minute of calling | ₹4 per credit
                    </p>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between text-sm">
                        <span>Credits:</span>
                        <span className="font-medium">{credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span>Rate:</span>
                        <span className="font-medium">₹{CREDIT_RATE} per credit</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between">
                        <span className="font-semibold">Total Amount:</span>
                        <span className="font-bold text-lg">₹{calculateAmount().toFixed(2)}</span>
                    </div>
                </div>

                {/* Purchase button */}
                <Button
                    onClick={handlePurchase}
                    disabled={loading || credits <= 0}
                    className="w-full"
                    size="lg"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Purchase {credits} Credits for ₹{calculateAmount()}
                        </>
                    )}
                </Button>

                {/* Razorpay script */}
                <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </CardContent>
        </Card>
    )
}
