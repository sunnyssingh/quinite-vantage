
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from 'lucide-react'

export default function RetryCallDialog({ open, onOpenChange, onConfirm, loading }) {
    const [reasonType, setReasonType] = useState('')
    const [customReason, setCustomReason] = useState('')

    const handleConfirm = () => {
        const finalReason = reasonType === 'other' ? customReason : reasonType
        if (!finalReason) return
        onConfirm(finalReason)
    }

    const predefinedReasons = [
        { value: 'customer_busy', label: 'Customer Busy / Asked to call later' },
        { value: 'no_answer', label: 'No Answer (Manual Retry)' },
        { value: 'bad_connection', label: 'Bad Connection / Call Dropped' },
        { value: 'wrong_number_corrected', label: 'Wrong Number (Corrected)' },
        { value: 'other', label: 'Other' }
    ]

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Retry Call</DialogTitle>
                    <DialogDescription>
                        Queue this call for an immediate retry. Please specify the reason.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="reason">Reason</Label>
                        <Select value={reasonType} onValueChange={setReasonType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                            </SelectTrigger>
                            <SelectContent>
                                {predefinedReasons.map((reason) => (
                                    <SelectItem key={reason.value} value={reason.value}>
                                        {reason.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {reasonType === 'other' && (
                        <div className="grid gap-2">
                            <Label htmlFor="custom-reason">Details</Label>
                            <Textarea
                                id="custom-reason"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Enter specific reason..."
                            />
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirm} disabled={loading || !reasonType || (reasonType === 'other' && !customReason)}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Retry Call
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
