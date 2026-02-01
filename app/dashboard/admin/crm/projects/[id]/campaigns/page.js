'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogHeader
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from "@/components/ui/skeleton"
import {
    Loader2,
    Megaphone,
    Calendar,
    Clock,
    Edit,
    Trash2,
    Plus,
    Radio,
    Building2,
    CheckCircle2,
    PlayCircle,
    PauseCircle,
    XCircle,
    Phone,
    KanbanSquare,
    ArrowLeft
} from 'lucide-react'
import { toast } from 'react-hot-toast'

const StatusBadge = ({ status }) => {
    const statusConfig = {
        scheduled: {
            color: 'bg-blue-500/10 text-blue-600 border-blue-200',
            icon: <Clock className="w-3 h-3" />
        },
        active: {
            color: 'bg-green-500/10 text-green-600 border-green-200',
            icon: <PlayCircle className="w-3 h-3" />
        },
        paused: {
            color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
            icon: <PauseCircle className="w-3 h-3" />
        },
        completed: {
            color: 'bg-purple-500/10 text-purple-600 border-purple-200',
            icon: <CheckCircle2 className="w-3 h-3" />
        },
        cancelled: {
            color: 'bg-red-500/10 text-red-600 border-red-200',
            icon: <XCircle className="w-3 h-3" />
        }
    }

    const config = statusConfig[status] || statusConfig.scheduled

    return (
        <Badge variant="outline" className={`${config.color} border font-medium flex items-center gap-1.5 w-fit px-2 py-0.5 h-5 text-[10px] uppercase tracking-wider`}>
            {config.icon}
            {status?.toUpperCase()}
        </Badge>
    )
}

export default function ProjectCampaignsPage() {
    const router = useRouter()
    const params = useParams()
    const projectId = params.id

    const [campaigns, setCampaigns] = useState([])
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)

    // Action States
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [starting, setStarting] = useState(false)
    const [startingCampaignId, setStartingCampaignId] = useState(null)

    // Create Form States
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [timeStart, setTimeStart] = useState('')
    const [timeEnd, setTimeEnd] = useState('')

    // Edit Form States
    const [editName, setEditName] = useState('')
    const [editDescription, setEditDescription] = useState('')
    const [editStartDate, setEditStartDate] = useState('')
    const [editEndDate, setEditEndDate] = useState('')
    const [editTimeStart, setEditTimeStart] = useState('')
    const [editTimeEnd, setEditTimeEnd] = useState('')
    const [editStatus, setEditStatus] = useState('scheduled')

    useEffect(() => {
        if (projectId) fetchData()
    }, [projectId])

    async function fetchData() {
        setLoading(true)
        try {
            // Fetch Campaigns for Project
            const cRes = await fetch(`/api/campaigns?project_id=${projectId}`)
            const cData = await cRes.json()
            setCampaigns(cData.campaigns || [])

            // Fetch Project Details (for the header title)
            const pRes = await fetch(`/api/projects?id=${projectId}`) // Assuming api/projects returns a list, checking if we can get single logic or filtering from list
            // The current API might return all projects. We'll find ours.
            const pData = await pRes.json()
            const foundProject = pData.projects?.find(p => p.id === projectId)
            if (foundProject) setProject(foundProject)

        } catch (e) {
            console.error(e)
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }

    async function createCampaign() {
        if (!name || !startDate || !endDate || !timeStart || !timeEnd) {
            toast.error("Please fill in all required fields")
            return
        }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End date cannot be before start date")
            return
        }

        try {
            const res = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId,
                    name,
                    description,
                    start_date: startDate,
                    end_date: endDate,
                    time_start: timeStart,
                    time_end: timeEnd
                })
            })

            if (!res.ok) {
                const payload = await res.json()
                throw new Error(payload?.error || 'Failed to create campaign')
            }

            const payload = await res.json()
            setCampaigns(prev => [payload.campaign, ...prev])
            toast.success("Campaign created successfully!")

            // Reset
            setName('')
            setDescription('')
            setStartDate('')
            setEndDate('')
            setTimeStart('')
            setTimeEnd('')
            setShowCreateForm(false)

        } catch (e) {
            console.error(e)
            toast.error(e.message || 'Failed to create campaign')
        }
    }

    async function handleDelete(campaign) {
        if (!confirm('Delete this campaign? This cannot be undone.')) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            setCampaigns(prev => prev.filter(c => c.id !== campaign.id))
            toast.success("Campaign deleted successfully!")
        } catch (err) {
            toast.error(err.message)
        } finally {
            setDeleting(false)
        }
    }

    function openEditModal(campaign) {
        setEditingCampaign(campaign)
        setEditName(campaign.name || '')
        setEditDescription(campaign.description || '')
        setEditStartDate(campaign.start_date || '')
        setEditEndDate(campaign.end_date || '')
        setEditTimeStart(campaign.time_start || '')
        setEditTimeEnd(campaign.time_end || '')
        setEditStatus(campaign.status || 'scheduled')
        setEditModalOpen(true)
    }

    async function handleUpdate() {
        if (!editingCampaign) return

        try {
            const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: projectId, // Ensure it stays on this project
                    name: editName,
                    description: editDescription,
                    start_date: editStartDate,
                    end_date: editEndDate,
                    time_start: editTimeStart,
                    time_end: editTimeEnd,
                    status: editStatus
                })
            })

            if (!res.ok) throw new Error('Update failed')

            const data = await res.json()
            setCampaigns(prev => prev.map(c => c.id === data.campaign.id ? data.campaign : c))
            setEditModalOpen(false)
            toast.success("Campaign updated successfully!")
        } catch (err) {
            toast.error(err.message)
        }
    }

    async function handleStartCampaign(campaign) {
        setStarting(true)
        setStartingCampaignId(campaign.id)
        try {
            const res = await fetch(`/api/campaigns/${campaign.id}/start`, { method: 'POST' })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to start')

            setCampaigns(prev => prev.map(c => c.id === data.campaign.id ? data.campaign : c))
            toast.success("Campaign started successfully!")
        } catch (err) {
            toast.error(err.message)
        } finally {
            setStarting(false)
            setStartingCampaignId(null)
        }
    }

    return (
        <div className="min-h-screen bg-muted/5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b border-border bg-background shadow-sm">
                <div>
                    {/* Back Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mb-2 pl-0 -ml-2 text-muted-foreground hover:text-foreground"
                        onClick={() => router.push('/dashboard/admin/crm/projects')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Back to Projects
                    </Button>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <Megaphone className="w-7 h-7 text-foreground" />
                        {project ? `${project.name} Campaigns` : 'Project Campaigns'}
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Manage outbound campaigns specifically for this project
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="gap-2 h-9 text-sm font-medium shadow-md hover:shadow-lg transition-all"
                        size="sm"
                    >
                        <Plus className="w-4 h-4" />
                        New Campaign
                    </Button>
                </div>
            </div>

            <div className="p-6 space-y-6">
                {/* Create Form */}
                {showCreateForm && (
                    <Card className="shadow-sm border border-border bg-card">
                        <CardHeader className="border-b border-border bg-muted/20">
                            <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                                <Radio className="w-4 h-4 text-primary" />
                                Create New Campaign
                            </CardTitle>
                            <CardDescription>Schedule a new outbound call campaign for {project?.name}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {/* Simplified Form without Project Selection */}
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                                    <Megaphone className="w-3.5 h-3.5 opacity-70" />
                                    Campaign Name *
                                </label>
                                <Input
                                    placeholder="e.g., Summer Promotion"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                                    Description
                                </label>
                                <Textarea
                                    placeholder="Describe the purpose of this campaign..."
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={3}
                                />
                            </div>

                            <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                                <h4 className="font-medium text-foreground mb-3 flex items-center gap-2 text-sm">
                                    <Calendar className="w-3.5 h-3.5 text-primary" />
                                    Campaign Schedule
                                </h4>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Start Date *</label>
                                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">End Date *</label>
                                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 mt-3">
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 opacity-70" /> Start Time *
                                        </label>
                                        <Input type="time" value={timeStart} onChange={e => setTimeStart(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 opacity-70" /> End Time *
                                        </label>
                                        <Input type="time" value={timeEnd} onChange={e => setTimeEnd(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col-reverse md:flex-row gap-3 mt-6 pt-6 border-t border-border">
                                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">Cancel</Button>
                                <Button onClick={createCampaign} className="flex-1">
                                    <Plus className="w-4 h-4 mr-2" /> Create Campaign
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Campaigns Grid */}
                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        <Skeleton className="h-64 w-full rounded-xl" />
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                ) : campaigns.length === 0 ? (
                    <Card className="py-20 border-border bg-card shadow-sm">
                        <CardContent className="text-center">
                            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                <Radio className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">No campaigns yet</h3>
                            <p className="text-muted-foreground mb-4">Create your first campaign for this project</p>
                            <Button onClick={() => setShowCreateForm(true)}>
                                <Plus className="w-4 h-4 mr-2" /> Create Campaign
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {campaigns.map(campaign => (
                            <Card key={campaign.id} className="overflow-hidden group hover:shadow-md transition-all duration-300 border-border bg-card rounded-xl">
                                <div className="relative bg-muted/30 p-4 border-b border-border/50">
                                    <div className="flex items-start justify-between">
                                        <div className="p-2 bg-background rounded-lg border border-border shadow-sm">
                                            <Phone className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => openEditModal(campaign)} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                <Edit className="w-4 h-4" /><span className="sr-only">Edit</span>
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(campaign)} disabled={deleting} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                                                <Trash2 className="w-4 h-4" /><span className="sr-only">Delete</span>
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="p-5 space-y-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground mb-1 truncate hover:text-primary transition-colors">{campaign.name}</h3>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Building2 className="w-3 h-3 flex-shrink-0 opacity-70" />
                                            <span className="truncate">{project?.name || 'Project'}</span>
                                        </p>
                                    </div>
                                    {campaign.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2">{campaign.description}</p>
                                    )}
                                    <div className="pt-2"><StatusBadge status={campaign.status || 'scheduled'} /></div>

                                    {/* Stats & Actions */}
                                    <div className="pt-3 border-t border-border/50 space-y-3">
                                        <Button
                                            onClick={() => handleStartCampaign(campaign)}
                                            disabled={starting || campaign.status === 'completed'}
                                            className="w-full text-xs h-8"
                                            size="sm"
                                            variant={campaign.status === 'completed' ? "secondary" : "default"}
                                        >
                                            {starting && startingCampaignId === campaign.id ? (
                                                <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> Calling...</>
                                            ) : campaign.status === 'completed' ? (
                                                <><CheckCircle2 className="w-3.5 h-3.5 mr-2" /> Completed</>
                                            ) : (
                                                <><PlayCircle className="w-3.5 h-3.5 mr-2" /> Start Campaign</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => router.push(`/dashboard/admin/crm/projects/${campaign.project_id}/pipeline`)}
                                            className="w-full h-8 text-xs border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                                            size="sm"
                                        >
                                            <KanbanSquare className="w-3.5 h-3.5 mr-2" /> Open Pipeline
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal - Simplified */}
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="w-5 h-5 text-purple-600" /> Edit Campaign
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Campaign Name *</label>
                            <Input value={editName} onChange={e => setEditName(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
                            <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
                            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} className="w-full rounded-md border px-3 py-2">
                                <option value="scheduled">Scheduled</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label><Input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} /></div>
                            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label><Input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} /></div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Time *</label><Input type="time" value={editTimeStart} onChange={e => setEditTimeStart(e.target.value)} /></div>
                            <div><label className="text-sm font-medium text-slate-700 mb-1.5 block">End Time *</label><Input type="time" value={editTimeEnd} onChange={e => setEditTimeEnd(e.target.value)} /></div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdate}>Update Campaign</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
