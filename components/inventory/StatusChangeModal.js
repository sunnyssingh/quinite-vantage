'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function StatusChangeModal({ property, isOpen, onClose, onStatusChanged }) {
    const [selectedStatus, setSelectedStatus] = useState(property?.status || 'available')
    const [loading, setLoading] = useState(false)

    const statusOptions = [
        { value: 'available', label: 'Available', icon: CheckCircle2, color: 'bg-green-100 text-green-700 border-green-300' },
        { value: 'reserved', label: 'Reserved', icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-300' },
        { value: 'sold', label: 'Sold', icon: CheckCircle2, color: 'bg-purple-100 text-purple-700 border-purple-300' }
    ]

    const handleStatusChange = async () => {
        if (!property || selectedStatus === property.status) {
            onClose()
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`/api/inventory/properties/${property.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: selectedStatus })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update status')
            }

            toast.success(`Property status updated to ${selectedStatus}`)

            // Notify parent component with updated data
            if (onStatusChanged) {
                onStatusChanged(data.property, data.projectMetrics)
            }

            onClose()
        } catch (error) {
            console.error('Status update error:', error)
            toast.error(error.message || 'Failed to update property status')
        } finally {
            setLoading(false)
        }
    }

    if (!property) return null

    const currentStatusConfig = statusOptions.find(s => s.value === property.status)
    const newStatusConfig = statusOptions.find(s => s.value === selectedStatus)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Change Property Status</DialogTitle>
                    <DialogDescription>
                        Update the status for <span className="font-semibold text-foreground">{property.title}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Current Status */}
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">Current:</span>
                        <Badge variant="outline" className={`${currentStatusConfig?.color} border font-semibold`}>
                            {currentStatusConfig?.label}
                        </Badge>
                    </div>

                    {/* Status Options */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Select New Status:</label>
                        <div className="grid gap-2">
                            {statusOptions.map(option => {
                                const Icon = option.icon
                                return (
                                    <button
                                        key={option.value}
                                        onClick={() => setSelectedStatus(option.value)}
                                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${selectedStatus === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-border hover:border-blue-300 hover:bg-muted/50'
                                            }`}
                                    >
                                        <Icon className={`w-5 h-5 ${selectedStatus === option.value ? 'text-blue-600' : 'text-muted-foreground'}`} />
                                        <span className={`font-medium ${selectedStatus === option.value ? 'text-blue-900' : 'text-foreground'}`}>
                                            {option.label}
                                        </span>
                                        {selectedStatus === option.value && (
                                            <CheckCircle2 className="w-4 h-4 text-blue-600 ml-auto" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Warning for status change */}
                    {selectedStatus !== property.status && property.project_id && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-blue-800">
                                This will automatically update the project's unit counts
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleStatusChange}
                        disabled={loading || selectedStatus === property.status}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? 'Updating...' : 'Update Status'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
