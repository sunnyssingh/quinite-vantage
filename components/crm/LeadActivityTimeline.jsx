'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Mail, Phone, MessageSquare, FileText, Plus, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { Skeleton } from '@/components/ui/skeleton'

const INTERACTION_TYPES = {
    email: { icon: Mail, label: 'Email', color: 'bg-blue-100 text-blue-700' },
    call: { icon: Phone, label: 'Call', color: 'bg-green-100 text-green-700' },
    meeting: { icon: Clock, label: 'Meeting', color: 'bg-purple-100 text-purple-700' },
    note: { icon: FileText, label: 'Note', color: 'bg-gray-100 text-gray-700' },
    sms: { icon: MessageSquare, label: 'SMS', color: 'bg-orange-100 text-orange-700' },
    whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'bg-green-100 text-green-700' }
}

export default function LeadActivityTimeline({ leadId }) {
    const [interactions, setInteractions] = useState([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [formData, setFormData] = useState({
        type: 'note',
        direction: 'outbound',
        subject: '',
        content: '',
        duration: '',
        outcome: ''
    })

    useEffect(() => {
        fetchInteractions()
    }, [leadId])

    const fetchInteractions = async () => {
        try {
            setLoading(true)
            const res = await fetch(`/api/leads/${leadId}/interactions`)
            if (!res.ok) throw new Error('Failed to fetch interactions')
            const data = await res.json()
            setInteractions(data.interactions || [])
        } catch (error) {
            console.error('Error fetching interactions:', error)
            toast.error('Failed to load activity timeline')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            setSubmitting(true)
            const res = await fetch(`/api/leads/${leadId}/interactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    duration: formData.duration ? parseInt(formData.duration) : null
                })
            })

            if (!res.ok) throw new Error('Failed to add interaction')

            toast.success('Activity added successfully')
            setDialogOpen(false)
            setFormData({
                type: 'note',
                direction: 'outbound',
                subject: '',
                content: '',
                duration: '',
                outcome: ''
            })
            fetchInteractions()
        } catch (error) {
            console.error('Error adding interaction:', error)
            toast.error('Failed to add activity')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <CardTitle>Activity Timeline</CardTitle>
                    <CardDescription>All interactions and communications</CardDescription>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Activity
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Add New Activity</DialogTitle>
                            <DialogDescription>Record an interaction with this lead</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="call">Call</SelectItem>
                                            <SelectItem value="meeting">Meeting</SelectItem>
                                            <SelectItem value="note">Note</SelectItem>
                                            <SelectItem value="sms">SMS</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Direction</Label>
                                    <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="outbound">Outbound</SelectItem>
                                            <SelectItem value="inbound">Inbound</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Subject</Label>
                                <Input
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    placeholder="Brief summary"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Details</Label>
                                <Textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Detailed notes about this interaction"
                                    rows={4}
                                />
                            </div>

                            {(formData.type === 'call' || formData.type === 'meeting') && (
                                <div className="space-y-2">
                                    <Label>Duration (minutes)</Label>
                                    <Input
                                        type="number"
                                        value={formData.duration}
                                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                        placeholder="Duration in minutes"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Outcome</Label>
                                <Input
                                    value={formData.outcome}
                                    onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                                    placeholder="What was the result?"
                                />
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={submitting} className="flex-1">
                                    {submitting ? 'Adding...' : 'Add Activity'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {interactions.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="w-6 h-6 text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-900">No activity yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start by adding a note or logging a call.</p>
                    </div>
                ) : (
                    <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gray-200 first:before:mt-1 last:before:h-auto">
                        {interactions.map((interaction) => {
                            const typeInfo = INTERACTION_TYPES[interaction.type] || INTERACTION_TYPES.note
                            const Icon = typeInfo.icon

                            return (
                                <div key={interaction.id} className="relative pl-6">
                                    {/* Timeline Node */}
                                    <div className={`absolute left-[-21px] top-0 p-1.5 rounded-full bg-white ring-4 ring-white border-2 ${typeInfo.color.replace('text-', 'border-').replace('bg-', 'border-').split(' ')[0]}-200`}>
                                        <Icon className={`w-3.5 h-3.5 ${typeInfo.color.split(' ')[1]}`} />
                                    </div>

                                    {/* Content Card */}
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-sm text-gray-900">{interaction.subject}</h4>
                                                <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0 h-5">
                                                    {typeInfo.label}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true })}
                                            </span>
                                        </div>

                                        {interaction.content && (
                                            <div className="text-sm text-gray-600 bg-gray-50/50 p-3 rounded-md border border-gray-100">
                                                {interaction.content}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs text-gray-500">
                                            {interaction.duration && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{interaction.duration}m</span>
                                                </div>
                                            )}
                                            {interaction.outcome && (
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium text-gray-700">Outcome:</span>
                                                    <span>{interaction.outcome}</span>
                                                </div>
                                            )}
                                            {interaction.created_by_user && (
                                                <div className="flex items-center gap-1 ml-auto">
                                                    <span>by {interaction.created_by_user.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
