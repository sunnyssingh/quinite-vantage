'use client'

import { useState, useEffect } from 'react'
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
import { Plus, Upload, UserPlus, Mail, Phone, Edit, Search, ChevronDown, ChevronUp, Volume2 } from 'lucide-react'
import CallRecordingPlayer from '@/components/CallRecordingPlayer'

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [updatingStatus, setUpdatingStatus] = useState(false)

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
    setError('')
    setSuccess('')
    setSubmitting(true)

    const formData = new FormData(e.target)
    const projectIdValue = formData.get('projectId')

    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      projectId: projectIdValue === 'none' ? null : projectIdValue,
      status: formData.get('status'),
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

      setSuccess(editingLead ? 'Lead updated successfully' : 'Lead created successfully')
      e.target.reset()
      setEditingLead(null)

      setTimeout(() => {
        setDialogOpen(false)
        setSuccess('')
        fetchData()
      }, 1200)
    } catch (err) {
      setError(err.message)
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
      setSuccess('Status updated successfully')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const getStatusBadgeColor = (status) => {
    const colors = {
      'new': 'bg-blue-100 text-blue-800',
      'contacted': 'bg-yellow-100 text-yellow-800',
      'qualified': 'bg-purple-100 text-purple-800',
      'converted': 'bg-green-100 text-green-800',
      'lost': 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Manage your leads and contacts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Upload CSV
          </Button>

          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) {
              setEditingLead(null)
              setError('')
              setSuccess('')
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Lead
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLead ? 'Edit Lead' : 'Create New Lead'}</DialogTitle>
                <DialogDescription>
                  {editingLead ? 'Update lead information' : 'Add a new lead to your database'}
                </DialogDescription>
              </DialogHeader>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 text-green-600 p-3 rounded-md text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    name="name"
                    placeholder="John Doe"
                    defaultValue={editingLead?.name}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="john@example.com"
                    defaultValue={editingLead?.email}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    name="phone"
                    placeholder="+91 98765 43210"
                    defaultValue={editingLead?.phone}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select name="projectId" defaultValue={editingLead?.project_id || 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingLead?.status || 'new'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                  <Textarea
                    name="notes"
                    placeholder="Additional notes..."
                    defaultValue={editingLead?.notes}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Saving...' : editingLead ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search leads by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
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
          <CardDescription>
            {leads.length} lead{leads.length !== 1 ? 's' : ''} in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No leads yet</p>
              <p className="text-sm mt-2">
                {searchQuery || statusFilter !== 'all'
                  ? 'No leads match your filters'
                  : 'Add your first lead to get started'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="font-medium">{lead.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone className="w-3 h-3" />
                            {lead.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.project?.name || <span className="text-gray-400">-</span>}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lead.call_log_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRow(lead.id)}
                            title="Listen to Recording"
                          >
                            <Volume2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(lead)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
