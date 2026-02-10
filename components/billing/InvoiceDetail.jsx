'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Download, FileText, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function InvoiceDetail({ invoiceId, onClose }) {
    const [invoice, setInvoice] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (invoiceId) {
            fetchInvoiceDetails()
        }
    }, [invoiceId])

    const fetchInvoiceDetails = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/billing/invoices/${invoiceId}`)
            const data = await res.json()

            if (res.ok) {
                setInvoice(data.invoice)
            } else {
                toast.error('Failed to load invoice details')
            }
        } catch (error) {
            console.error('Error fetching invoice:', error)
            toast.error('Error loading invoice')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadPDF = async () => {
        try {
            const res = await fetch(`/api/billing/invoices/${invoiceId}/download`)

            if (res.ok) {
                const blob = await res.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${invoice.invoice_number}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
                toast.success('Invoice downloaded')
            } else {
                toast.error('Failed to download invoice')
            }
        } catch (error) {
            console.error('Error downloading invoice:', error)
            toast.error('Error downloading invoice')
        }
    }

    const getStatusBadge = (status) => {
        const colors = {
            paid: 'bg-green-100 text-green-800',
            issued: 'bg-blue-100 text-blue-800',
            overdue: 'bg-red-100 text-red-800',
            draft: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-gray-100 text-gray-800',
            refunded: 'bg-purple-100 text-purple-800'
        }

        return (
            <Badge className={colors[status] || colors.draft}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        )
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </CardContent>
            </Card>
        )
    }

    if (!invoice) {
        return null
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {invoice.invoice_number}
                        </CardTitle>
                        <CardDescription>
                            Billing Period: {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(invoice.status)}
                        {onClose && (
                            <Button variant="ghost" size="icon" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Invoice Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Invoice Date</p>
                        <p className="font-medium">{new Date(invoice.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-medium">{new Date(invoice.due_date).toLocaleDateString()}</p>
                    </div>
                    {invoice.paid_at && (
                        <div>
                            <p className="text-sm text-muted-foreground">Paid On</p>
                            <p className="font-medium">{new Date(invoice.paid_at).toLocaleDateString()}</p>
                        </div>
                    )}
                    {invoice.payment_method && (
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Method</p>
                            <p className="font-medium capitalize">{invoice.payment_method}</p>
                        </div>
                    )}
                </div>

                <Separator />

                {/* Line Items */}
                <div className="space-y-3">
                    <h3 className="font-semibold">Line Items</h3>
                    {invoice.line_items && invoice.line_items.length > 0 ? (
                        <div className="space-y-2">
                            {invoice.line_items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{item.description}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {item.quantity} × ₹{parseFloat(item.unit_price).toFixed(2)}
                                        </p>
                                    </div>
                                    <p className="font-semibold">₹{parseFloat(item.amount).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No line items</p>
                    )}
                </div>

                <Separator />

                {/* Amount Breakdown */}
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subscription Charges</span>
                        <span>₹{parseFloat(invoice.subscription_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Call Credits</span>
                        <span>₹{parseFloat(invoice.credits_amount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tax ({invoice.tax_percentage}%)</span>
                        <span>₹{parseFloat(invoice.tax_amount).toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total Amount</span>
                        <span>₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
                    </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <h3 className="font-semibold">Notes</h3>
                            <p className="text-sm text-muted-foreground">{invoice.notes}</p>
                        </div>
                    </>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                    <Button onClick={handleDownloadPDF} className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                    </Button>
                    {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                        <Button variant="default" className="flex-1">
                            Pay Now
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
