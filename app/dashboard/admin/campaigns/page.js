'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogHeader
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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
  Phone
} from 'lucide-react'

const StatusBadge = ({ status }) => {
  const statusConfig = {
    scheduled: {
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: <Clock className="w-3 h-3" />
    },
    active: {
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <PlayCircle className="w-3 h-3" />
    },
    paused: {
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: <PauseCircle className="w-3 h-3" />
    },
    completed: {
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: <CheckCircle2 className="w-3 h-3" />
    },
    cancelled: {
      color: 'bg-red-100 text-red-800 border-red-200',
      icon: <XCircle className="w-3 h-3" />
    }
  }

  const config = statusConfig[status] || statusConfig.scheduled

  return (
    <Badge className={`${config.color} border font-medium flex items-center gap-1.5 w-fit`}>
      {config.icon}
      {status?.toUpperCase()}
    </Badge>
  )
}

import { useToast } from '@/hooks/use-toast'

export default function CampaignsPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [starting, setStarting] = useState(false)
  const [startingCampaignId, setStartingCampaignId] = useState(null)
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false)
  const [campaignResults, setCampaignResults] = useState(null)

  // Create form states
  const [projectId, setProjectId] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')

  // Edit form states
  const [editProjectId, setEditProjectId] = useState('')
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editStartDate, setEditStartDate] = useState('')
  const [editEndDate, setEditEndDate] = useState('')
  const [editTimeStart, setEditTimeStart] = useState('')
  const [editTimeEnd, setEditTimeEnd] = useState('')
  const [editStatus, setEditStatus] = useState('scheduled')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/projects')
      ])
      const cData = await cRes.json()
      const pData = await pRes.json()
      setCampaigns(cData.campaigns || [])
      setProjects(pData.projects || [])
    } catch (e) {
      console.error(e)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load campaigns or projects"
      })
    } finally {
      setLoading(false)
    }
  }

  async function createCampaign() {
    setError(null)
    setSuccess(null)

    if (!projectId || !name || !startDate || !endDate || !timeStart || !timeEnd) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields"
      })
      return
    }

    // Validate end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "End date cannot be before start date"
      })
      return
    }

    // Validate time range
    if (timeEnd <= timeStart) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "End time must be after start time"
      })
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
      toast({
        title: "Success",
        description: "Campaign created successfully!"
      })

      // Reset form
      setName('')
      setDescription('')
      setProjectId('')
      setStartDate('')
      setEndDate('')
      setTimeStart('')
      setTimeEnd('')
      setShowCreateForm(false)

    } catch (e) {
      console.error(e)
      toast({
        variant: "destructive",
        title: "Error",
        description: e.message || 'Failed to create campaign'
      })
    }
  }

  async function handleDelete(campaign) {
    if (!confirm('Delete this campaign? This cannot be undone.')) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Delete failed')
      }

      setCampaigns(prev => prev.filter(c => c.id !== campaign.id))
      toast({
        title: "Success",
        description: "Campaign deleted successfully!"
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Delete failed'
      })
    } finally {
      setDeleting(false)
    }
  }

  function openEditModal(campaign) {
    setEditingCampaign(campaign)
    setEditProjectId(campaign.project_id || '')
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

    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: editProjectId,
          name: editName,
          description: editDescription,
          start_date: editStartDate,
          end_date: editEndDate,
          time_start: editTimeStart,
          time_end: editTimeEnd,
          status: editStatus
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Update failed')
      }

      const data = await res.json()
      setCampaigns(prev => prev.map(c => c.id === data.campaign.id ? data.campaign : c))
      setEditModalOpen(false)
      toast({
        title: "Success",
        description: "Campaign updated successfully!"
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Update failed'
      })
    }
  }

  function getProjectName(projectId) {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
  }

  async function handleCancel(campaignId) {
    try {
      await fetch(`/api/campaigns/${campaignId}/cancel`, { method: 'POST' })
      toast({
        title: "Request Sent",
        description: "Cancelling campaign... this may take a few seconds."
      })
    } catch (e) {
      console.error(e)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to cancel campaign"
      })
    }
  }

  function handleProgressComplete() {
    // The polling detected completion, but the main handleStartCampaign will likely close the modal.
    // We can leave this empty or use it to force close if needed.
  }

  async function handleStartCampaign(campaign) {
    setStarting(true)
    setStartingCampaignId(campaign.id)
    setError(null)

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/start`, {
        method: 'POST'
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start campaign')
      }

      // Update campaign in list
      setCampaigns(prev => prev.map(c => c.id === data.campaign.id ? data.campaign : c))

      // Show results
      setCampaignResults(data.summary)
      setResultsDialogOpen(true)
      toast({
        title: "Success",
        description: "Campaign completed successfully!"
      })
    } catch (err) {
      console.error(err)
      toast({
        variant: "destructive",
        title: "Error",
        description: err.message || 'Failed to start campaign'
      })
    } finally {
      setStarting(false)
      setStartingCampaignId(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <Megaphone className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            Campaigns
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Create and manage your outbound call campaigns</p>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full md:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="shadow-xl border-2 border-purple-100">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Radio className="w-5 h-5 text-purple-600" />
              Create New Campaign
            </CardTitle>
            <CardDescription>Schedule a new outbound call campaign for your project</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Project *
                </label>
                <select
                  value={projectId}
                  onChange={e => setProjectId(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-purple-600" />
                  Campaign Name *
                </label>
                <Input
                  placeholder="e.g., Summer Promotion"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Describe the purpose of this campaign..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="border-slate-300"
              />
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Campaign Schedule
              </h4>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="border-slate-300"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 mt-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    Start Time *
                  </label>
                  <Input
                    type="time"
                    value={timeStart}
                    onChange={e => setTimeStart(e.target.value)}
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-600" />
                    End Time *
                  </label>
                  <Input
                    type="time"
                    value={timeEnd}
                    onChange={e => setTimeEnd(e.target.value)}
                    className="border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse md:flex-row gap-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createCampaign}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="ml-3 text-slate-600">Loading campaigns...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="py-20">
          <CardContent className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mb-4">
              <Radio className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No campaigns yet</h3>
            <p className="text-slate-600 mb-4">Create your first campaign to start scheduling calls</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map(campaign => (
            <Card key={campaign.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-200">
              <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-6">
                <div className="flex items-start justify-between">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Phone className="w-6 h-6 text-white" />
                  </div>

                  {/* Action Buttons - Always visible on mobile, hover on desktop */}
                  <div className="flex gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(campaign)}
                      className="shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white h-8 w-8 p-0"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(campaign)}
                      disabled={deleting}
                      className="shadow-lg h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{getProjectName(campaign.project_id)}</span>
                  </p>
                </div>

                {campaign.description && (
                  <p className="text-sm text-slate-700 line-clamp-2">{campaign.description}</p>
                )}

                {/* Status */}
                <div className="pt-2">
                  <StatusBadge status={campaign.status || 'scheduled'} />
                </div>

                {/* Campaign Schedule */}
                <div className="pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      Duration
                    </span>
                    <span className="text-slate-900 font-medium text-right">
                      {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      {' - '}
                      {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Time Window
                    </span>
                    <span className="text-slate-900 font-medium">
                      {campaign.time_start || '—'} - {campaign.time_end || '—'}
                    </span>
                  </div>
                </div>

                {/* Stats & Actions */}
                <div className="pt-3 border-t space-y-3">
                  {campaign.total_calls > 0 && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <div className="text-slate-500">Total Calls</div>
                        <div className="font-semibold text-slate-900">{campaign.total_calls}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Transferred</div>
                        <div className="font-semibold text-green-600">{campaign.transferred_calls || 0}</div>
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleStartCampaign(campaign)}
                    disabled={starting || campaign.status === 'completed'}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    size="sm"
                  >
                    {starting && startingCampaignId === campaign.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Calling...
                      </>
                    ) : campaign.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Completed
                      </>
                    ) : (
                      <>
                        <PlayCircle className="w-4 h-4 mr-2" />
                        Start Campaign
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-slate-500">
                    Created {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-purple-600" />
              Edit Campaign
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Project *</label>
                <select
                  value={editProjectId}
                  onChange={e => setEditProjectId(e.target.value)}
                  className="w-full rounded-md border px-3 py-2"
                >
                  <option value="">Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Campaign Name *</label>
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <Textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full rounded-md border px-3 py-2"
              >
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                <Input
                  type="date"
                  value={editStartDate}
                  onChange={e => setEditStartDate(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
                <Input
                  type="date"
                  value={editEndDate}
                  onChange={e => setEditEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Time *</label>
                <Input
                  type="time"
                  value={editTimeStart}
                  onChange={e => setEditTimeStart(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Time *</label>
                <Input
                  type="time"
                  value={editTimeEnd}
                  onChange={e => setEditTimeEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Update Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress Modal */}
      <Dialog open={!!startingCampaignId} onOpenChange={() => { }}>
        <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
              Campaign Running...
            </DialogTitle>
            <CardDescription>
              Calling leads for this campaign. Please do not close this window.
            </CardDescription>
          </DialogHeader>

          <CampaignProgress campaignId={startingCampaignId} onCancel={handleCancel} onComplete={handleProgressComplete} />
        </DialogContent>
      </Dialog>

      {/* Results Dialog */}
      <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
              Campaign Completed
            </DialogTitle>
          </DialogHeader>

          {campaignResults && (
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-slate-900">{campaignResults.totalCalls || campaignResults.processed || 0}</div>
                      <div className="text-sm text-slate-500 mt-1">Total Calls</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{campaignResults.transferredCalls || 0}</div>
                      <div className="text-sm text-slate-500 mt-1">Transferred</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{campaignResults.conversionRate || "0%"}</div>
                      <div className="text-sm text-slate-500 mt-1">Conversion Rate</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Call Logs */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-lg p-2">
                <h4 className="font-medium text-sm text-slate-700 px-2 sticky top-0 bg-white pb-2">Call Results</h4>
                {campaignResults.callLogs?.map((log, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-sm">
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {log.leadName}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5 capitalize">{log.outcome || log.status}</div>
                    </div>
                    {log.transferred && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">Transferred</Badge>
                    )}
                  </div>
                ))}
                {!campaignResults.callLogs?.length && (
                  <div className="text-center py-8 text-slate-400">
                    No calls made yet
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setResultsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CampaignProgress({ campaignId, onCancel, onComplete }) {
  const [progress, setProgress] = useState({ percentage: 0, processed: 0, total: 0 })
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    let interval
    if (campaignId) {
      // Poll progress every 1s
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/campaigns/${campaignId}/progress`)
          if (res.ok) {
            const data = await res.json()
            setProgress(data)

            // If status is cancelled or completed, simpler to let the parent handle the API response
            // But if the parent API call is stalled or disconnected, we might need to auto-close here.
            // For now, we rely on the Start API returning to close this modal.
          }
        } catch (e) {
          console.error("Poll error", e)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [campaignId])

  const handleCancelClick = async () => {
    setCancelling(true)
    await onCancel(campaignId)
    // Don't close immediately, wait for the Start API to return 'cancelled'
  }

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Progress</span>
          <span className="font-medium">{progress.percentage}%</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>{progress.processed} called</span>
          <span>{progress.total} total</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="sm"
          onClick={handleCancelClick}
          disabled={cancelling}
        >
          {cancelling ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Cancelling...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 mr-2" />
              Cancel Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
