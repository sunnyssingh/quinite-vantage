'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'

const LeadSourceDialog = dynamic(() => import('@/components/crm/LeadSourceDialog'), {
  ssr: false,
  loading: () => null
})
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

import { Plus, UserPlus, Mail, Phone, Edit, Search, Volume2, Trash2, FileDown, RefreshCw, User, Lock, Shield } from 'lucide-react'
import { usePermission } from '@/contexts/PermissionContext'
import PermissionTooltip from '@/components/permissions/PermissionTooltip'
import CallRecordingPlayer from '@/components/CallRecordingPlayer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from 'react-hot-toast'
import { getDefaultAvatar } from '@/lib/avatar-utils'

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const projectId = searchParams.get('project_id')

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)

  const [leads, setLeads] = useState([])
  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [stageFilter, setStageFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Permissions
  const canCreate = usePermission('create_leads')
  const canDelete = usePermission('delete_leads')
  const canEditAll = usePermission('edit_all_leads')
  const canEditTeam = usePermission('edit_team_leads')
  const canEditOwn = usePermission('edit_own_leads')
  const canAssign = usePermission('assign_leads')

  // Helper to check if user can edit a specific lead
  const canEditLead = (lead) => {
    if (canEditAll || canEditTeam) return true
    return canEditOwn // Simplified
  }

  // Bulk Selection
  const [selectedLeads, setSelectedLeads] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Stages for the edit form
  const [stages, setStages] = useState([])
  const [loadingStages, setLoadingStages] = useState(false)

  // Users for Assignment
  const [users, setUsers] = useState([])

  // Organization settings for currency
  const [organization, setOrganization] = useState(null)

  // Fetch stages when project changes in edit form
  const fetchStages = async (pid) => {
    setLoadingStages(true)
    try {
      const url = (!pid || pid === 'none')
        ? '/api/pipeline/stages'
        : `/api/pipeline/stages?projectId=${pid}`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setStages(data.stages || [])
      }
    } catch (e) {
      console.error('Failed to fetch stages', e)
      setStages([])
    } finally {
      setLoadingStages(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users || [])
      }
    } catch (e) {
      console.error('Failed to fetch users', e)
    }
  }

  // Effect to fetch stages when editing a lead with a project
  useEffect(() => {
    if (editingLead?.project_id) {
      fetchStages(editingLead.project_id)
    } else {
      setStages([])
    }
  }, [editingLead])

  // Fetch initial data
  useEffect(() => {
    fetchUsers()
  }, [])



  // Fetch stages if we are in a project context (for Table Dropdowns)
  useEffect(() => {
    if (projectId) {
      fetchStages(projectId)
    } else {
      fetchAllStages()
    }
  }, [projectId])

  const fetchAllStages = async () => {
    setLoadingStages(true)
    try {
      const res = await fetch('/api/pipeline/stages')
      if (res.ok) {
        const data = await res.json()
        setStages(data.stages || [])
      }
    } catch (e) {
      console.error('Failed to fetch all stages', e)
    } finally {
      setLoadingStages(false)
    }
  }

  const handleStageUpdate = async (leadId, newStageId) => {
    setUpdatingStatus(true)
    try {
      const lead = leads.find(l => l.id === leadId)
      const payload = {
        name: lead.name,
        stageId: newStageId
      }

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to update stage')
      }

      // Optimistic update
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, stage_id: newStageId, stage: stages.find(s => s.id === newStageId) } : lead
      ))

      toast.success("Stage updated successfully")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // CSV Preview & Other Logic - Keeping it simple by focusing on CRUD & Redesign
  // Note: Removed complex CSV upload for now as per previous task, or keeping it minimal if needed.
  // The user asked for "More professional and beautiful", so focusing on UI.
  // I will keep the fetch logic and basic CRUD.

  useEffect(() => {
    fetchData()
    fetchOrganization()
  }, [stageFilter, searchQuery, projectId])

  const fetchOrganization = async () => {
    try {
      const res = await fetch('/api/organization/settings')
      if (res.ok) {
        const data = await res.json()
        setOrganization(data.organization)
      }
    } catch (error) {
      console.error('Failed to fetch organization settings:', error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (stageFilter !== 'all') params.append('stage_id', stageFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (projectId) params.append('project_id', projectId)

      const leadsRes = await fetch(`/api/leads?${params}`)
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }

      const projectsRes = await fetch('/api/projects')
      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data.projects || [])
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    const formData = new FormData(e.target)
    const projectIdValue = formData.get('projectId')

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      projectId: projectIdValue === 'none' ? null : projectIdValue,
      status: formData.get('status'),
      stageId: formData.get('stageId') === 'none' ? null : formData.get('stageId'),
      dealValue: formData.get('dealValue'),
      notes: formData.get('notes'),
      assignedTo: formData.get('assignedTo') === 'unassigned' ? null : formData.get('assignedTo')
    }

    try {
      const url = editingLead ? `/api/leads/${editingLead.id}` : '/api/leads'
      const method = editingLead ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save lead')
      }

      toast.success(editingLead ? 'Lead updated successfully' : 'Lead created successfully')
      e.target.reset()
      setEditingLead(null)

      setTimeout(() => {
        setDialogOpen(false)
        fetchData()
      }, 1000)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (lead) => {
    if (!canEditLead(lead)) return
    setEditingLead(lead)
    setDialogOpen(true)
  }

  const toggleRow = (leadId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId)
    } else {
      newExpanded.add(leadId)
    }
    setExpandedRows(newExpanded)
  }

  const handleDelete = async () => {
    if (!leadToDelete) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        // Only try to parse JSON if there's content
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          throw new Error(data.error || 'Failed to delete lead')
        } else {
          throw new Error('Failed to delete lead')
        }
      }
      setLeads(prev => prev.filter(l => l.id !== leadToDelete.id))
      toast.success("Lead deleted successfully")
      setDeleteDialogOpen(false)
      setLeadToDelete(null)
    } catch (err) {
      toast.error(err.message)
      setDeleteDialogOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  // Bulk Actions
  const toggleSelection = (id) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedLeads(newSelected)
  }

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedLeads(new Set(leads.map(l => l.id)))
    } else {
      setSelectedLeads(new Set())
    }
  }

  const handleBulkDelete = async () => {
    if (!canDelete) return
    if (selectedLeads.size === 0 || !confirm(`Are you sure you want to delete ${selectedLeads.size} leads?`)) return

    setBulkDeleting(true)
    try {
      // Execute deletes in parallel (or use a bulk delete API if available)
      const promises = Array.from(selectedLeads).map(id =>
        fetch(`/api/leads/${id}`, { method: 'DELETE' }).then(res => {
          if (!res.ok) throw new Error(`Failed to delete lead ${id}`)
          return id
        })
      )

      await Promise.allSettled(promises)

      // Refresh data
      setLeads(prev => prev.filter(l => !selectedLeads.has(l.id)))
      setSelectedLeads(new Set())
      toast.success("Selected leads deleted")
    } catch (err) {
      toast.error("Some leads failed to delete")
    } finally {
      setBulkDeleting(false)
    }
  }

  const [bulkAssigning, setBulkAssigning] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const handleBulkAssign = async (assigneeId) => {
    if (!canAssign) return
    if (selectedLeads.size === 0) return

    setBulkAssigning(true)
    try {
      const promises = Array.from(selectedLeads).map(id => {
        const lead = leads.find(l => l.id === id)
        return fetch(`/api/leads/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: lead.name,
            assignedTo: assigneeId === 'unassigned' ? null : assigneeId
          })
        }).then(res => {
          if (!res.ok) throw new Error(`Failed to assign lead ${id}`)
          return id
        })
      })

      await Promise.allSettled(promises)

      // Refresh data
      await fetchData()
      setSelectedLeads(new Set())
      setAssignDialogOpen(false)
      toast.success("Selected leads assigned")
    } catch (err) {
      toast.error("Some leads failed to assign")
    } finally {
      setBulkAssigning(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'transferred': 'bg-purple-100 text-purple-800',
      'converted': 'bg-green-100 text-green-800',
      'lost': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const formatCallStatus = (callStatus) => {
    const labels = {
      'not_called': 'Not Called',
      'called': 'Called',
      'transferred': 'Transferred',
      'no_answer': 'No Answer',
      'voicemail': 'Voicemail'
    }
    return labels[callStatus] || callStatus
  }

  const getProjectName = () => {
    if (!projectId) return null
    const p = projects.find(proj => proj.id === projectId)
    return p ? p.name : 'Project'
  }
  const projectName = getProjectName()

  // Calculate Stats based on Pipeline Stages
  const stats = {
    total: leads.length,
    new: leads.filter(l => {
      const stageName = (l.stage?.name || '').toLowerCase()
      return stageName.includes('new') || stageName.includes('lead') || !l.stage_id
    }).length,
    contacted: leads.filter(l => {
      const stageName = (l.stage?.name || '').toLowerCase()
      return stageName.includes('contact') || stageName.includes('qualif')
    }).length,
    converted: leads.filter(l => {
      const stageName = (l.stage?.name || '').toLowerCase()
      return stageName.includes('convert') || stageName.includes('won') || stageName.includes('closed')
    }).length
  }

  // Prevent hydration errors by not rendering complex UI until mounted
  if (!isMounted) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="h-64 bg-muted/10 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen animate-in fade-in duration-500 bg-muted/5">
      {/* Header & Stats */}
      <div className="flex flex-col gap-6 p-6 border-b border-border bg-background shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {projectId ? `${projectName} Leads` : 'Leads'}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm flex items-center gap-2">
              Manage and track your potential customers.
              {projectId && (
                <Button variant="link" size="sm" className="h-auto p-0 text-primary" onClick={() => router.push('/dashboard/admin/crm/leads')}>
                  ← Show All
                </Button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2 h-9 border-dashed">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <PermissionTooltip
              hasPermission={canCreate}
              message="You need 'Create Leads' permission to add new leads."
            >
              <Button
                onClick={() => {
                  if (!canCreate) return
                  setIsAddLeadOpen(true)
                }}
                disabled={!canCreate}
                className="gap-2 h-9 text-sm font-medium shadow-md hover:shadow-lg transition-all"
              >
                {!canCreate && <Lock className="w-3.5 h-3.5" />}
                <Plus className="w-4 h-4" />
                Add Lead
              </Button>
            </PermissionTooltip>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: stats.total, color: 'text-foreground' },
            { label: 'New Leads', value: stats.new, color: 'text-blue-600' },
            { label: 'Contacted', value: stats.contacted, color: 'text-yellow-600' },
            { label: 'Converted', value: stats.converted, color: 'text-green-600' }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col px-4 py-3 bg-card border border-border/50 rounded-xl shadow-sm">
              <span className="text-xs font-medium text-muted-foreground uppercase">{stat.label}</span>
              <span className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-card/50 p-1 rounded-lg md:w-fit">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-background border-border/50 focus:border-primary transition-colors"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full md:w-[180px] h-9 bg-background border-border/50">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.map(stage => (
                <SelectItem key={stage.id} value={stage.id}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                    {stage.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedLeads.size > 0 && (
        <div className="mx-6 mt-4 p-2 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 px-2">
            <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/30">
              {selectedLeads.size} Selected
            </Badge>
            <span className="text-sm text-muted-foreground">Select all {leads.length} leads?</span>
          </div>
          <div className="flex items-center gap-2">
            <PermissionTooltip
              hasPermission={canAssign}
              message="You need 'Assign Leads' permission to assign leads."
            >
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (!canAssign) return
                  setAssignDialogOpen(true)
                }}
                disabled={bulkAssigning || !canAssign}
                className="h-8 flex items-center gap-2"
              >
                {!canAssign && <Lock className="w-3.5 h-3.5" />}
                {bulkAssigning ? 'Assigning...' : 'Assign Selected'}
              </Button>
            </PermissionTooltip>
            <PermissionTooltip
              hasPermission={canDelete}
              message="You need 'Delete Leads' permission to delete leads."
            >
              <Button
                size="sm"
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={bulkDeleting || !canDelete}
                className="h-8 flex items-center gap-2"
              >
                {!canDelete && <Lock className="w-3.5 h-3.5" />}
                {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </PermissionTooltip>
          </div>
        </div>
      )
      }

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) setEditingLead(null)
      }}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
            <DialogDescription>Update lead details and status.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input name="name" defaultValue={editingLead?.name} required placeholder="Full Name" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input name="phone" defaultValue={editingLead?.phone} placeholder="+91..." />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input name="email" type="email" defaultValue={editingLead?.email} placeholder="email@example.com" />
            </div>

            {canAssign && (
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select name="assignedTo" defaultValue={editingLead?.assigned_to || 'unassigned'}>
                  <SelectTrigger><SelectValue placeholder="Select User" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Project Context</Label>
              {projectId ? (
                <div className="px-3 py-2 bg-muted/50 border border-border rounded-md text-sm font-medium">
                  {projectName}
                </div>
              ) : (
                <Select name="projectId" defaultValue={editingLead?.project_id || 'none'} onValueChange={fetchStages}>
                  <SelectTrigger><SelectValue placeholder="Assign Project" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <input type="hidden" name="projectId" value={projectId || (editingLead?.project_id || 'none')} />
            </div>

            <div className="space-y-2">
              <Label>Forecast Value</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">
                  {organization?.currency_symbol || '$'}
                </span>
                <Input
                  name="dealValue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={editingLead?.deals?.[0]?.amount || ''}
                  placeholder="0.00"
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Stage / Status</Label>
              {stages.length > 0 ? (
                <Select name="stageId" defaultValue={editingLead?.stage_id || 'none'}>
                  <SelectTrigger><SelectValue placeholder="Select Stage" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Stage</SelectItem>
                    {stages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>

              ) : (
                <div className="p-2 text-sm text-yellow-600 bg-yellow-50 rounded border border-yellow-200">
                  No pipeline stages found. Please configure a pipeline for this project.
                  <input type="hidden" name="stageId" value="" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea name="notes" defaultValue={editingLead?.notes} placeholder="Add notes..." className="resize-none" rows={3} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Assign {selectedLeads.size} Leads</DialogTitle>
            <DialogDescription>Select a user to assign the selected leads to.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select onValueChange={(value) => handleBulkAssign(value)} disabled={bulkAssigning}>
                <SelectTrigger>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setAssignDialogOpen(false)} disabled={bulkAssigning}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Scrollable Content */}
      <div className="p-6">
        {loading ? (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <Skeleton className="h-6 w-1/4 rounded-md" />
              <Skeleton className="h-6 w-24 rounded-md" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
                  <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3 rounded" />
                    <Skeleton className="h-3 w-1/4 rounded" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : leads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <div className="p-4 bg-muted/30 rounded-full mb-4">
              <UserPlus className="w-8 h-8 opacity-50" />
            </div>
            <h3 className="text-lg font-medium text-foreground">No leads found</h3>
            <p className="text-sm">Get started by adding a new lead manually.</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[50px] pl-6">
                    <Checkbox
                      checked={leads.length > 0 && selectedLeads.size === leads.length}
                      onCheckedChange={toggleAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[280px]">Lead Details</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <React.Fragment key={lead.id}>
                    <TableRow className={`group hover:bg-muted/30 transition-colors ${selectedLeads.has(lead.id) ? 'bg-muted/40' : ''}`}>
                      {/* Checkbox */}
                      <TableCell className="pl-6 py-4">
                        <Checkbox
                          checked={selectedLeads.has(lead.id)}
                          onCheckedChange={() => toggleSelection(lead.id)}
                          aria-label={`Select ${lead.name}`}
                        />
                      </TableCell>

                      {/* Avatar & Name */}
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-border/50">
                            <AvatarImage src={lead.avatar_url || getDefaultAvatar(lead.email || lead.name)} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium text-sm">
                              {lead.name ? lead.name.substring(0, 2).toUpperCase() : 'NA'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground text-sm">{lead.name}</div>
                            <div className="text-[11px] text-muted-foreground uppercase tracking-wide font-medium mt-0.5">
                              {lead.source || 'Manual'}
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Assigned To */}
                      <TableCell className="py-4">
                        {lead.assigned_to ? (
                          (() => {
                            const assignee = users.find(u => u.id === lead.assigned_to)
                            return (
                              <div className="flex items-center gap-2" title={assignee?.full_name || 'Assigned User'}>
                                <Avatar className="h-6 w-6 border border-border/50">
                                  {/* Use a simple placeholder if we don't have avatar URL for assignee yet, or fetch it if included in lead data */}
                                  <AvatarFallback className="bg-blue-100 text-blue-700 text-[10px]">
                                    {assignee?.full_name ? assignee.full_name.substring(0, 2).toUpperCase() : 'U'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-foreground">{assignee?.full_name || 'Unknown'}</span>
                              </div>
                            )
                          })()
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Unassigned</span>
                        )}
                      </TableCell>

                      {/* Contact */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
                          {lead.email && (
                            <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{lead.email}</span>
                            </div>
                          )}
                          {lead.phone && (
                            <div className="flex items-center gap-2 hover:text-foreground transition-colors">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{lead.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Status Dropdown (Compact) */}
                      <TableCell>
                        {lead.stage ? (
                          // Lead has stage data - show it
                          stages.length > 0 ? (
                            // Stages available - show dropdown
                            <Select
                              defaultValue={lead.stage_id || 'none'}
                              onValueChange={(v) => handleStageUpdate(lead.id, v)}
                              disabled={updatingStatus}
                            >
                              <SelectTrigger className="w-[140px] h-7 text-xs border-0 bg-transparent hover:bg-muted/50 p-0 shadow-none data-[placeholder]:text-muted-foreground ring-0 focus:ring-0">
                                <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary w-fit">
                                  {lead.stage.color && (
                                    <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: lead.stage.color }} />
                                  )}
                                  {lead.stage.name}
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                {stages.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    <div className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                                      {s.name}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            // No stages array but lead has stage - show badge only
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary w-fit">
                              {lead.stage.color && (
                                <div className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: lead.stage.color }} />
                              )}
                              {lead.stage.name}
                            </div>
                          )
                        ) : (
                          // No stage data at all
                          <div className="text-xs text-muted-foreground italic">No Stage</div>
                        )}
                      </TableCell>

                      <TableCell>
                        {lead.project ? (
                          <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                            {lead.project.name}
                          </Badge>
                        ) : '-'}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                          Created
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                          {lead.call_log_id && <Button variant="ghost" size="sm" onClick={() => toggleRow(lead.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"><Volume2 className="w-4 h-4" /></Button>}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                            onClick={() => router.push(`/dashboard/admin/crm/leads/${lead.id}`)}
                            title="View Profile"
                          >
                            <User className="w-4 h-4" />
                          </Button>
                          <PermissionTooltip
                            hasPermission={canEditLead(lead)}
                            message="You don't have permission to edit this lead."
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 relative"
                              onClick={() => handleEdit(lead)}
                              disabled={!canEditLead(lead)}
                            >
                              {!canEditLead(lead) && <Lock className="w-3 h-3 absolute" />}
                              <Edit className="w-4 h-4" />
                            </Button>
                          </PermissionTooltip>

                          <PermissionTooltip
                            hasPermission={canDelete}
                            message="You need 'Delete Leads' permission."
                          >
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 relative"
                              onClick={() => {
                                if (!canDelete) return
                                setLeadToDelete(lead)
                                setDeleteDialogOpen(true)
                              }}
                              disabled={!canDelete}
                            >
                              {!canDelete && <Lock className="w-3 h-3 absolute" />}
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </PermissionTooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(lead.id) && lead.call_log_id && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-gray-50 p-4 border-b">
                          <CallRecordingPlayer callLogId={lead.call_log_id} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lead
              <strong> {leadToDelete?.name}</strong> and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              onClick={handleDelete}
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LeadSourceDialog
        open={isAddLeadOpen}
        onOpenChange={setIsAddLeadOpen}
        projectId={projectId}
        projects={projects}
      />
    </div >
  )
}
