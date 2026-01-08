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
import { Alert, AlertDescription } from '@/components/ui/alert'

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

export default function CampaignsPage() {
  const supabase = createClient()

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
      setError('Failed to load campaigns or projects')
    } finally {
      setLoading(false)
    }
  }

  async function createCampaign() {
    setError(null)
    setSuccess(null)

    if (!projectId || !name || !startDate || !endDate || !timeStart || !timeEnd) {
      setError('Please fill in all required fields')
      return
    }

    // Validate end date is not before start date
    if (new Date(endDate) < new Date(startDate)) {
      setError('End date cannot be before start date')
      return
    }

    // Validate time range
    if (timeEnd <= timeStart) {
      setError('End time must be after start time')
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
      setSuccess('Campaign created successfully!')

      // Reset form
      setName('')
      setDescription('')
      setProjectId('')
      setStartDate('')
      setEndDate('')
      setTimeStart('')
      setTimeEnd('')
      setShowCreateForm(false)

      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      console.error(e)
      setError(e.message || 'Failed to create campaign')
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
      setSuccess('Campaign deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Delete failed')
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
      setSuccess('Campaign updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Update failed')
    }
  }

  function getProjectName(projectId) {
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown Project'
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
      setSuccess('Campaign completed successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to start campaign')
    } finally {
      setStarting(false)
      setStartingCampaignId(null)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-purple-50/30 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
              <Megaphone className="w-7 h-7 text-white" />
            </div>
            Campaigns
          </h1>
          <p className="text-slate-600 mt-1">Create and manage your outbound call campaigns</p>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

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

            <div className="flex gap-3 mt-6 pt-6 border-t">
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

                  {/* Action Buttons */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(campaign)}
                      className="shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(campaign)}
                      disabled={deleting}
                      className="shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <CardContent className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {getProjectName(campaign.project_id)}
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
                    <span className="text-slate-900 font-medium">
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
                        Calling Leads...
                      </>
                    ) : campaign.status === 'completed' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Campaign Completed
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
                      <div className="text-3xl font-bold text-slate-900">{campaignResults.totalCalls}</div>
                      <div className="text-sm text-slate-500 mt-1">Total Calls</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{campaignResults.transferredCalls}</div>
                      <div className="text-sm text-slate-500 mt-1">Transferred</div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{campaignResults.conversionRate}%</div>
                      <div className="text-sm text-slate-500 mt-1">Conversion Rate</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Call Logs Preview */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3">Call Results</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {campaignResults.callLogs?.slice(0, 10).map((log, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-sm">{log.leadName}</div>
                          <div className="text-xs text-slate-500">{log.outcome?.replace('_', ' ') || 'Unknown'}</div>
                        </div>
                      </div>
                      {log.transferred && (
                        <Badge className="bg-green-100 text-green-800">
                          Transferred
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                {campaignResults.callLogs?.length > 10 && (
                  <div className="text-sm text-slate-500 text-center mt-2">
                    And {campaignResults.callLogs.length - 10} more calls...
                  </div>
                )}
              </div>

              <Button
                onClick={() => setResultsDialogOpen(false)}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
