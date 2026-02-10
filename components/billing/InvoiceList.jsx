'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Eye } from 'lucide-react'
import InvoiceDetail from './InvoiceDetail'

export default function InvoiceList({ invoices, onRefresh }) {
    const [selectedInvoice, setSelectedInvoice] = useState(null)

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

    if (selectedInvoice) {
        return (
            <InvoiceDetail
                invoiceId={selectedInvoice}
                onClose={() => {
                    setSelectedInvoice(null)
                    if (onRefresh) onRefresh()
                }}
            />
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invoice History</CardTitle>
                <CardDescription>View and download your billing invoices</CardDescription>
            </CardHeader>
            <CardContent>
                {!invoices || invoices.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No invoices yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {invoices.map((invoice) => (
                            <div
                                key={invoice.id}
                                className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <p className="font-medium">{invoice.invoice_number}</p>
                                        {getStatusBadge(invoice.status)}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(invoice.billing_period_start).toLocaleDateString()} - {new Date(invoice.billing_period_end).toLocaleDateString()}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Due: {new Date(invoice.due_date).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="font-bold text-lg">₹{parseFloat(invoice.total_amount).toFixed(2)}</p>
                                        {invoice.status === 'paid' && invoice.paid_at && (
                                            <p className="text-xs text-green-600">
                                                Paid on {new Date(invoice.paid_at).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setSelectedInvoice(invoice.id)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                                            <Button size="sm">
                                                Pay Now
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
