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
        <Card className="h-full border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
            <CardHeader className="bg-slate-50/50 pb-4 border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-xl text-slate-800">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    Purchase Call Credits
                </CardTitle>
                <CardDescription className="pt-2 flex items-center gap-2">
                    Current Balance:
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-sm">
                        {currentBalance?.toFixed(2) || '0.00'}
                    </span> credits
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {/* Preset amounts */}
                <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Quick Select</Label>
                    <div className="grid grid-cols-5 gap-2">
                        {presetAmounts.map((amount) => (
                            <Button
                                key={amount}
                                variant={credits === amount ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCredits(amount)}
                                className={`text-xs h-9 transition-all ${credits === amount
                                        ? 'bg-blue-600 hover:bg-blue-700 shadow-md transform scale-105'
                                        : 'hover:border-blue-300 hover:bg-blue-50/50'
                                    }`}
                            >
                                {amount}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Custom amount */}
                <div className="space-y-3">
                    <Label htmlFor="credits" className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Custom Amount</Label>
                    <div className="relative">
                        <Input
                            id="credits"
                            type="number"
                            min="1"
                            value={credits}
                            onChange={(e) => setCredits(parseInt(e.target.value) || 0)}
                            className="pl-10 h-11 text-lg font-medium border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="Enter credits"
                        />
                        <div className="absolute left-3 top-3 text-slate-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 pl-1">
                        1 Credit = 1 Minute of calling | <span className="font-semibold text-slate-700">₹4 per credit</span>
                    </p>
                </div>

                {/* Price breakdown */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Credits Selected</span>
                        <span className="font-semibold text-slate-900">{credits}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Rate</span>
                        <span className="font-medium text-slate-900">₹{CREDIT_RATE} / credit</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 mt-1 flex justify-between items-center">
                        <span className="font-bold text-slate-800">Total Payable</span>
                        <span className="font-bold text-2xl text-blue-600">₹{calculateAmount().toFixed(2)}</span>
                    </div>
                </div>

                {/* Purchase button */}
                <Button
                    onClick={handlePurchase}
                    disabled={loading || credits <= 0}
                    className="w-full h-12 text-base font-semibold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-[0.98]"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing Payment...
                        </>
                    ) : (
                        <>
                            Pay ₹{calculateAmount()} Securely
                        </>
                    )}
                </Button>

                {/* Razorpay script */}
                <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
            </CardContent>
        </Card>
    )
}
