
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import RetryCallDialog from './RetryCallDialog'
import { toast } from 'react-hot-toast'

export default function FailedCallsList({ open, onOpenChange }) {
    const [calls, setCalls] = useState([])
    const [loading, setLoading] = useState(true)
    const [retryLoading, setRetryLoading] = useState(false)
    const [selectedCall, setSelectedCall] = useState(null)
    const [retryDialogOpen, setRetryDialogOpen] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        if (open) {
            fetchFailedCalls()
        }
    }, [open])

    const fetchFailedCalls = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('call_queue')
                .select(`
                    *,
                    lead:leads(id, name, phone, email),
                    campaign:campaigns(id, name)
                `)
                .eq('status', 'failed')
                .order('updated_at', { ascending: false })

            if (error) throw error
            setCalls(data || [])
        } catch (error) {
            console.error('Error fetching failed calls:', error)
            toast.error('Failed to load failed calls')
        } finally {
            setLoading(false)
        }
    }

    const handleRetryClick = (call) => {
        setSelectedCall(call)
        setRetryDialogOpen(true)
    }

    const handleRetryConfirm = async (reason) => {
        if (!selectedCall) return

        setRetryLoading(true)
        try {
            const response = await fetch(`/api/crm/calls/queue/${selectedCall.id}/retry`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to retry call')
            }

            toast.success('Call queued for retry')
            setRetryDialogOpen(false)
            fetchFailedCalls() // Refresh list
        } catch (error) {
            console.error('Error retrying call:', error)
            toast.error(error.message)
        } finally {
            setRetryLoading(false)
            setSelectedCall(null)
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Failed Calls
                            <Badge variant="secondary" className="ml-2">{calls.length}</Badge>
                        </DialogTitle>
                        <DialogDescription>
                            Review and retry calls that failed to process.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-auto mt-4 border rounded-md">
                        {loading ? (
                            <div className="flex items-center justify-center h-40">
                                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : calls.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                                <p>No failed calls found</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Lead</TableHead>
                                        <TableHead>Campaign</TableHead>
                                        <TableHead>Failed At</TableHead>
                                        <TableHead>Error/Reason</TableHead>
                                        <TableHead>Attempts</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {calls.map((call) => (
                                        <TableRow key={call.id}>
                                            <TableCell>
                                                <div className="font-medium">{call.lead?.name || 'Unknown'}</div>
                                                <div className="text-xs text-muted-foreground">{call.lead?.phone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{call.campaign?.name || '-'}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm cursor-help" title={new Date(call.updated_at).toLocaleString()}>
                                                    {formatDistanceToNow(new Date(call.updated_at), { addSuffix: true })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm max-w-[200px] truncate text-red-600 font-medium" title={call.last_error}>
                                                    {call.last_error || 'Unknown error'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{call.attempt_count} / {call.max_attempts}</div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="gap-2"
                                                    onClick={() => handleRetryClick(call)}
                                                >
                                                    <RefreshCw className="w-3.5 h-3.5" />
                                                    Retry
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <RetryCallDialog
                open={retryDialogOpen}
                onOpenChange={setRetryDialogOpen}
                onConfirm={handleRetryConfirm}
                loading={retryLoading}
            />
        </>
    )
}
