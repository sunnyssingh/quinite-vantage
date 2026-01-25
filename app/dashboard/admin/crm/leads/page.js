'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import LeadSourceDialog from '@/components/crm/LeadSourceDialog'

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
  DialogTrigger
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
import { Plus, Upload, UserPlus, Mail, Phone, Edit, Search, ChevronDown, ChevronUp, Volume2, Trash2, FileDown } from 'lucide-react'
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
import { toast } from 'react-hot-toast'

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const router = useRouter() // [NEW]
  const projectId = searchParams.get('project_id')

  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false) // [NEW]

  const [leads, setLeads] = useState([])
  const [projects, setProjects] = useState([])

  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [leadToDelete, setLeadToDelete] = useState(null)

  // Stages for the edit form
  const [stages, setStages] = useState([])
  const [loadingStages, setLoadingStages] = useState(false)

  // Fetch stages when project changes in edit form
  const fetchStages = async (pid) => {
    if (!pid || pid === 'none') {
      setStages([])
      return
    }
    setLoadingStages(true)
    try {
      const res = await fetch(`/api/pipeline/stages?projectId=${pid}`)
      if (res.ok) {
        const data = await res.json()
        setStages(data.stages || [])
      }
    } catch (e) {
      console.error('Failed to fetch stages', e)
    } finally {
      setLoadingStages(false)
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

  // [NEW] Fetch stages if we are in a project context (for Table Dropdowns)
  // If no project selected, fetch all stages
  useEffect(() => {
    if (projectId) {
      fetchStages(projectId)
    } else {
      // Fetch all stages across all projects
      fetchAllStages()
    }
  }, [projectId])

  const fetchAllStages = async () => {
    console.log('🔄 [fetchAllStages] Fetching all stages...')
    setLoadingStages(true)
    try {
      const res = await fetch('/api/pipeline/stages')
      if (res.ok) {
        const data = await res.json()
        setStages(data.stages || [])
        console.log('✅ [fetchAllStages] Fetched stages:', data.stages?.length)
      }
    } catch (e) {
      console.error('Failed to fetch all stages', e)
    } finally {
      setLoadingStages(false)
    }
  }

  const handleStageUpdate = async (leadId, newStageId) => {
    console.log('🔄 [handleStageUpdate] Starting update:', { leadId, newStageId })
    setUpdatingStatus(true)
    try {
      const lead = leads.find(l => l.id === leadId)
      console.log('📋 [handleStageUpdate] Found lead:', lead)
      const payload = {
        name: lead.name, // Required field
        stageId: newStageId
      }
      console.log('📤 [handleStageUpdate] Sending payload:', payload)

      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      console.log('📥 [handleStageUpdate] Response status:', res.status)

      if (!res.ok) {
        const errorData = await res.json()
        console.error('❌ [handleStageUpdate] Error response:', errorData)
        throw new Error(errorData.error || 'Failed to update stage')
      }

      // Optimistic update
      const updatedLead = await res.json()
      console.log('✅ [handleStageUpdate] Updated lead from API:', updatedLead)
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, stage_id: newStageId, stage: stages.find(s => s.id === newStageId) } : lead
      ))

      toast.success("Stage updated successfully")
    } catch (err) {
      toast.error(err.message)
      console.error('❌ [handleStageUpdate] Caught error:', err)
    } finally {
      setUpdatingStatus(false)
    }
  }

  // CSV Preview State
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewLeads, setPreviewLeads] = useState([])
  const [selectedProjectForImport, setSelectedProjectForImport] = useState('none')
  const [invalidRowCount, setInvalidRowCount] = useState(0)
  useEffect(() => {
    fetchData()
  }, [statusFilter, searchQuery])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Build query params
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (searchQuery) params.append('search', searchQuery)
      if (projectId) params.append('project_id', projectId) // [NEW] Context filter

      // Fetch leads
      const leadsRes = await fetch(`/api/leads?${params}`)
      if (leadsRes.ok) {
        const data = await leadsRes.json()
        setLeads(data.leads || [])
      }

      // Fetch projects for dropdown
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
      stageId: formData.get('stageId') === 'none' ? null : formData.get('stageId'), // [NEW] Sync with Kanban
      // recordingConsent: formData.get('recordingConsent') === 'on', // Removed as per user request
      notes: formData.get('notes')
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
      }, 1200)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (lead) => {
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

  const handleStatusUpdate = async (leadId, newStatus) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!res.ok) throw new Error('Failed to update status')

      // Update local state
      setLeads(prev => prev.map(lead =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ))
      toast.success("Status updated successfully")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }


  const handleDelete = async () => {
    if (!leadToDelete) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/leads/${leadToDelete.id}`, {
        method: 'DELETE'
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to delete lead')
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

  const getCallStatusBadgeColor = (callStatus) => {
    const colors = {
      'not_called': 'bg-gray-100 text-gray-600',
      'called': 'bg-green-100 text-green-700',
      'transferred': 'bg-blue-100 text-blue-700',
      'no_answer': 'bg-orange-100 text-orange-700',
      'voicemail': 'bg-purple-100 text-purple-700'
    }
    return colors[callStatus] || 'bg-gray-100 text-gray-600'
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

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast.error("Please upload a valid CSV file")
      return
    }

    setSubmitting(true)

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const rows = text.split('\n')
        const headers = rows[0].split(',').map(h => h.trim().toLowerCase())

        // Validate required headers
        const requiredHeaders = ['name', 'phone']
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))

        if (missingHeaders.length > 0) {
          throw new Error('Invalid CSV format. Please use our sample CSV template.')
        }

        const leads = []
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i].trim()
          if (!row) continue

          const values = row.split(',').map(v => v.trim())
          const lead = {}

          headers.forEach((header, index) => {
            if (values[index]) lead[header] = values[index]
          })

          // Validate Indian Phone Number format
          // Accepts: +91XXXXXXXXXX, 91XXXXXXXXXX, or XXXXXXXXXX (10 digits)
          if (lead.name && lead.phone) {
            // Clean the phone number (remove spaces/dashes/parentheses)
            let cleanPhone = lead.phone.toString().replace(/[\s\-\(\)]/g, '')

            // Case 1: 10 Digits (e.g., 9876543210) -> Add +91
            if (/^\d{10}$/.test(cleanPhone)) {
              cleanPhone = '+91' + cleanPhone
            }
            // Case 2: 12 Digits starting with 91 (e.g., 919876543210) -> Add +
            else if (/^91\d{10}$/.test(cleanPhone)) {
              cleanPhone = '+' + cleanPhone
            }

            // Final Check: Must match +91 followed by 10 digits
            if (/^\+91\d{10}$/.test(cleanPhone)) {
              lead.phone = cleanPhone // Use the standardized version
              leads.push(lead)
            }
          }
        }

        if (leads.length === 0) {
          throw new Error('No valid leads found. Please check your CSV format and phone numbers.')
        }

        // Show summary of what was parsed
        const totalRows = rows.length - 1 // Exclude header
        const validCount = leads.length
        const invalidCount = totalRows - validCount

        if (invalidCount > 0) {
          console.warn(`⚠️ Skipped ${invalidCount} invalid rows (missing name or invalid phone number)`)
        }

        setInvalidRowCount(invalidCount)

        // Instead of uploading immediately, set preview
        setPreviewLeads(leads)
        setPreviewOpen(true)

        // The following lines are moved to confirmUpload
        // const res = await fetch('/api/leads/upload', ...
      } catch (err) {
        toast.error(err.message || 'Error processing file')
      } finally {
        setSubmitting(false)
        e.target.value = '' // Reset input
      }
    }
    reader.readAsText(file) // Read the file
  }

  // Confirm Import (Called from Preview Dialog)
  const confirmUpload = async () => {
    setSubmitting(true)
    try {
      // Use new Universal Ingestion API
      const res = await fetch('/api/leads/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'csv_manual',
          map_project_id: selectedProjectForImport === 'none' ? null : selectedProjectForImport,
          data: previewLeads
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')

      toast.success(`Successfully uploaded ${data.processed} lead${data.processed > 1 ? 's' : ''}`)
      if (data.failed > 0) {
        toast.error(`${data.failed} leads failed to import. Check console.`)
        console.error("Failed Leads:", data.errors)
      }

      setPreviewOpen(false)
      setPreviewLeads([])
      setSelectedProjectForImport('none')
      setInvalidRowCount(0)
      fetchData()
    } catch (err) {
      toast.error(err.message || 'Error uploading leads')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to get project name
  const getProjectName = () => {
    if (!projectId) return null
    const p = projects.find(proj => proj.id === projectId)
    return p ? p.name : 'Project'
  }
  const projectName = getProjectName()

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 border-b bg-white">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {projectId ? `${projectName} Leads` : 'All Leads'}
          </h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base flex items-center gap-2">
            {projectId ? `Manage leads and contacts for ${projectName}` : 'Manage your leads and contacts'}
            {projectId && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-slate-500 hover:text-slate-900 px-2"
                onClick={() => router.push('/dashboard/admin/crm/leads')} // Uses imported router (assumed)
              >
                ← Back to All
              </Button>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">


          {/* CSV Upload & Other Buttons */}
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleFileUpload}
              disabled={submitting}
            />
            <Button variant="outline" className="gap-2" disabled={submitting}>
              <Upload className="w-4 h-4" />
              {submitting ? 'Uploading...' : 'Upload CSV'}
            </Button>
          </div>
          <Button variant="outline" className="gap-2" asChild>
            <a href="/sample_leads.csv" download>
              <FileDown className="w-4 h-4" /> Sample CSV
            </a>
          </Button>

          <Button
            onClick={() => setIsAddLeadOpen(true)}
            className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </Button>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setEditingLead(null)
          }}>
            {/* Trigger removed */}

            <DialogContent className="max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>Update lead information</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* ... Form Fields (Name, Email, Phone, Project, Status, Notes) ... */}
                {/* Simplified for replacement - keep existing logic same, just updating Confirm Upload above mostly */}
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input name="name" defaultValue={editingLead?.name} required />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input name="email" type="email" defaultValue={editingLead?.email} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input name="phone" defaultValue={editingLead?.phone} />
                </div>
                <div className="space-y-2">
                  <Label>Project</Label>
                  {projectId ? (
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 rounded-md border border-slate-200 text-slate-600 text-sm">
                      <span className="font-medium">{projectName}</span>
                      <span className="text-xs text-slate-400">(Pre-selected)</span>
                      <input type="hidden" name="projectId" value={projectId} />
                    </div>
                  ) : (
                    <Select
                      name="projectId"
                      defaultValue={editingLead?.project_id || 'none'}
                      onValueChange={(val) => fetchStages(val)}
                    >
                      <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {projects.filter(p => p.id).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Stage Selection */}
                <div className="space-y-2">
                  <Label>Pipeline Stage</Label>
                  <Select
                    name="stageId"
                    defaultValue={editingLead?.stage_id || 'none'}
                    disabled={loadingStages || stages.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={stages.length === 0 ? "Select Project First" : "Select Stage"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Stage</SelectItem>
                      {stages.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingLead?.status || 'new'}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea name="notes" defaultValue={editingLead?.notes} rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>{submitting ? 'Saving' : (editingLead ? 'Update' : 'Create')}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-slate-50/50 p-4 overflow-y-auto space-y-4">
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* ... Search & status filter ... */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="qualified">Qualified</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Leads Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Leads</CardTitle>
            <CardDescription>{leads.length} leads in database</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No leads yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name/Source</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Call Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leads.map(lead => (
                      <React.Fragment key={lead.id}>
                        <TableRow>
                          <TableCell>
                            <div className="font-medium">{lead.name}</div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">{lead.source || 'manual'}</div>
                          </TableCell>
                          <TableCell>
                            {/* Contact info */}
                            <div className="space-y-1 text-sm">
                              {lead.email && <div className="flex items-center gap-1 text-gray-600"><Mail className="w-3 h-3" />{lead.email}</div>}
                              {lead.phone && <div className="flex items-center gap-1 text-gray-600"><Phone className="w-3 h-3" />{lead.phone}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{lead.project?.name || '-'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 items-start">
                              {stages.length > 0 && lead.stage_id ? (
                                <Select
                                  defaultValue={lead.stage?.id || lead.stage_id || 'none'}
                                  onValueChange={(v) => handleStageUpdate(lead.id, v)}
                                  disabled={updatingStatus}
                                >
                                  <SelectTrigger className="w-[140px] h-8 text-xs font-medium bg-white border-slate-200">
                                    <div className="flex items-center gap-2 truncate">
                                      {lead.stage?.color && (
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: lead.stage.color }} />
                                      )}
                                      <span className="truncate">{lead.stage?.name || lead.status}</span>
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent>
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
                              ) : (
                                <Select defaultValue={lead.status || 'new'} onValueChange={(v) => handleStatusUpdate(lead.id, v)} disabled={updatingStatus}>
                                  <SelectTrigger className={`w-[130px] h-8 border-0 ${getStatusBadgeColor(lead.status)} text-xs font-semibold`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="transferred">Transferred</SelectItem>
                                    <SelectItem value="converted">Converted</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {lead.abuse_flag && (
                                <Badge variant="destructive" className="text-[10px] px-1 py-0 bg-red-600 text-white">ABUSIVE</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {lead.rejection_reason ? (
                                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                                  {lead.rejection_reason}
                                </Badge>
                              ) : '-'}
                              {(lead.notes || lead.disconnect_notes) && (
                                <div className="relative group">
                                  <span className="cursor-help text-gray-400 hover:text-gray-600">
                                    <FileDown className="w-4 h-4 rotate-180" /> {/* Using FileIcon or similar if available, else generic info */}
                                  </span>
                                  <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    {lead.notes || lead.disconnect_notes}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <Badge className={getCallStatusBadgeColor(lead.call_status)}>
                                {formatCallStatus(lead.call_status)}
                              </Badge>
                              {lead.waiting_status && (
                                <span className="text-[10px] text-blue-600 font-medium">
                                  Wait: {lead.waiting_status}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {lead.call_log_id && <Button variant="ghost" size="sm" onClick={() => toggleRow(lead.id)}><Volume2 className="w-4 h-4" /></Button>}
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(lead)}><Edit className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="text-red-500" onClick={() => { setLeadToDelete(lead); setDeleteDialogOpen(true) }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(lead.id) && lead.call_log_id && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-gray-50 p-4">
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
          </CardContent>
        </Card>

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

        {/* CSV Preview Dialog */}
        <Dialog open={previewOpen} onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) {
            // Reset preview state when dialog closes
            setPreviewLeads([])
            setSelectedProjectForImport('none')
            setInvalidRowCount(0)
          }
        }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Leads Import</DialogTitle>
              <DialogDescription>
                Checking {previewLeads.length} leads found in your CSV. Review them before importing.
              </DialogDescription>

              {invalidRowCount > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Warning:</strong> {invalidRowCount} row{invalidRowCount > 1 ? 's were' : ' was'} skipped due to missing name or invalid phone number.
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-4">
                <Label className="whitespace-nowrap">Assign to Project:</Label>
                <Select value={selectedProjectForImport} onValueChange={setSelectedProjectForImport}>
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Project (Unassigned)</SelectItem>
                    {projects.filter(p => p.id).map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogHeader>

            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewLeads.slice(0, 50).map((lead, i) => (
                    <TableRow key={i}>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.phone}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={lead.notes}>{lead.notes}</TableCell>
                    </TableRow>
                  ))}
                  {previewLeads.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        ... and {previewLeads.length - 50} more
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Cancel</Button>
              <Button onClick={confirmUpload} disabled={submitting}>
                {submitting ? 'Importing...' : `Import ${previewLeads.length} Leads`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div> {/* End content wrapper */}

      <LeadSourceDialog
        open={isAddLeadOpen}
        onOpenChange={setIsAddLeadOpen}
        projectId={projectId}
        projects={projects}
      />
    </div>
  )
}
