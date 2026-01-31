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
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No activity recorded yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Add your first interaction to start tracking</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {interactions.map((interaction) => {
                            const typeInfo = INTERACTION_TYPES[interaction.type] || INTERACTION_TYPES.note
                            const Icon = typeInfo.icon

                            return (
                                <div key={interaction.id} className="flex gap-4 pb-4 border-b last:border-0">
                                    <div className={`p-2 rounded-lg h-fit ${typeInfo.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between mb-1">
                                            <div>
                                                <h4 className="font-medium">{interaction.subject}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-xs">
                                                        {typeInfo.label}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs capitalize">
                                                        {interaction.direction}
                                                    </Badge>
                                                    {interaction.duration && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {interaction.duration} min
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(interaction.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        {interaction.content && (
                                            <p className="text-sm text-muted-foreground mt-2">{interaction.content}</p>
                                        )}
                                        {interaction.outcome && (
                                            <p className="text-sm text-foreground mt-2">
                                                <span className="font-medium">Outcome:</span> {interaction.outcome}
                                            </p>
                                        )}
                                        {interaction.created_by_user && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                By {interaction.created_by_user.name}
                                            </p>
                                        )}
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
