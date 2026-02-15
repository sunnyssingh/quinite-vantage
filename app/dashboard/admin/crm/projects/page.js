'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' // For Campaign Dialog
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription
} from '@/components/ui/dialog'
import { Building2, Plus, Sparkles, Loader2, Briefcase, LayoutGrid, List, X, Lock, RefreshCw } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import dynamic from 'next/dynamic'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectList from '@/components/projects/ProjectList'
import { usePermission } from '@/contexts/PermissionContext'
import PermissionTooltip from '@/components/permissions/PermissionTooltip'
import { useProjects } from '@/hooks/useProjects'

const ProjectForm = dynamic(() => import('@/components/projects/ProjectForm'), {
  loading: () => <Skeleton className="h-96 w-full" />
})

// Helper for safe number parsing
const safeParseFloat = (val) => {
  const n = parseFloat(val)
  return isNaN(n) ? 0 : n
}

export default function ProjectsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)

  // Data Fetching
  const { data: projectsData, metadata: projectsMetadata, isLoading: loading, isPlaceholderData, refetch } = useProjects({
    status: undefined, // Add filters if needed
    page,
    limit: 20
  })

  // useProjects now returns flattened data
  const projects = projectsData || []
  const metadata = projectsMetadata || {}


  const [submitting, setSubmitting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'

  // Edit State
  const [editOpen, setEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  // View State
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingProject, setViewingProject] = useState(null)

  // Campaign State
  const [addOpen, setAddOpen] = useState(false)

  // Permissions
  const canView = usePermission('view_projects')
  const canCreate = usePermission('create_projects')
  const canEdit = usePermission('edit_projects')
  const canDelete = usePermission('delete_projects')

  const [campName, setCampName] = useState('')
  const [campProjectId, setCampProjectId] = useState(null)
  const [campStartDate, setCampStartDate] = useState(new Date().toISOString().split('T')[0])
  const [campEndDate, setCampEndDate] = useState(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0])
  const [campTimeStart, setCampTimeStart] = useState('09:00')
  const [campTimeEnd, setCampTimeEnd] = useState('18:00')

  // Delete State
  const [deletingId, setDeletingId] = useState(null)

  // Removed manual fetch
  // useEffect(() => { fetchProjects() }, [])
  // async function fetchProjects() { ... }

  // --- Actions ---

  const handleCreate = async (formData) => {
    setSubmitting(true)
    try {
      // Transform logic (map flat form fields to nested schema)
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        image_url: formData.imageUrl,
        image_path: formData.imagePath,
        // Inventory fields
        total_units: safeParseFloat(formData.totalUnits),
        unit_types: formData.unitTypes,
        price_range: { min: safeParseFloat(formData.priceMin), max: safeParseFloat(formData.priceMax) },
        project_status: formData.projectStatus || 'planning',
        show_in_inventory: formData.showInInventory !== false,
        real_estate: {
          rera_number: formData.reraNumber,
          transaction: formData.transaction,
          property: {
            plot_area: safeParseFloat(formData.plotArea),
            category: formData.propertyCategory,
            use_case: formData.propertyUseCase,
            ...(formData.propertyCategory === 'residential' ? {
              residential: {
                bhk: formData.bhk,
                carpet_area: safeParseFloat(formData.carpetArea),
                built_up_area: safeParseFloat(formData.builtUpArea),
                super_built_up_area: safeParseFloat(formData.superBuiltUpArea)
              }
            } : {}),
            ...(formData.propertyCategory === 'commercial' ? {
              commercial: {
                area: safeParseFloat(formData.commercialArea),
                built_up_area: safeParseFloat(formData.commercialBuiltUpArea),
                ground_floor: formData.groundFloor
              }
            } : {}),
            ...(formData.propertyCategory === 'land' ? {
              land: {
                plot_area: safeParseFloat(formData.plotArea)
              }
            } : {})
          },
          location: { city: formData.locCity, locality: formData.locLocality, landmark: formData.locLandmark },
          pricing: { min: safeParseFloat(formData.priceMin), max: safeParseFloat(formData.priceMax) },
          media: { thumbnail: formData.imageUrl || null },
          description: formData.description || ''
        }
      }

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await refetch() // Refresh list instead of manual state update
      toast.success("Project created successfully!")
      setShowCreateForm(false)
    } catch (err) {
      toast.error(err.message || "Failed to create project")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (formData) => {
    if (!editingProject) return
    setSubmitting(true)

    try {
      // Same transform logic as create (ensure consistency)
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        image_url: formData.imageUrl,
        image_path: formData.imagePath,
        // Inventory fields
        total_units: safeParseFloat(formData.totalUnits),
        unit_types: formData.unitTypes,
        price_range: { min: safeParseFloat(formData.priceMin), max: safeParseFloat(formData.priceMax) },
        project_status: formData.projectStatus || 'planning',
        show_in_inventory: formData.showInInventory !== false,
        real_estate: {
          rera_number: formData.reraNumber,
          transaction: formData.transaction,
          property: {
            plot_area: safeParseFloat(formData.plotArea),
            category: formData.propertyCategory,
            use_case: formData.propertyUseCase,
            ...(formData.propertyCategory === 'residential' ? {
              residential: {
                bhk: formData.bhk,
                carpet_area: safeParseFloat(formData.carpetArea),
                built_up_area: safeParseFloat(formData.builtUpArea),
                super_built_up_area: safeParseFloat(formData.superBuiltUpArea)
              }
            } : {}),
            ...(formData.propertyCategory === 'commercial' ? {
              commercial: {
                area: safeParseFloat(formData.commercialArea),
                built_up_area: safeParseFloat(formData.commercialBuiltUpArea),
                ground_floor: formData.groundFloor
              }
            } : {}),
            ...(formData.propertyCategory === 'land' ? {
              land: {
                plot_area: safeParseFloat(formData.plotArea)
              }
            } : {})
          },
          location: { city: formData.locCity, locality: formData.locLocality, landmark: formData.locLandmark },
          pricing: { min: safeParseFloat(formData.priceMin), max: safeParseFloat(formData.priceMax) },
          media: { thumbnail: formData.imageUrl || null },
          description: formData.description || ''
        }
      }

      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      await refetch() // Refresh list
      setEditOpen(false)
      toast.success("Project updated successfully!")
    } catch (err) {
      toast.error(err.message || "Update failed")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (project) => {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setDeletingId(project.id)

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')

      await refetch() // Refresh list
      toast.success("Project deleted successfully!")
    } catch (err) {
      toast.error(err.message || "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateCampaign = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campName,
          project_id: campProjectId,
          start_date: campStartDate,
          end_date: campEndDate,
          time_start: campTimeStart,
          time_end: campTimeEnd
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast.success("Campaign created successfully!")
      setAddOpen(false)
      setCampName('')
      setCampProjectId(null)
      router.push('/dashboard/admin/campaigns')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/5">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Projects
          </h1>

          <PermissionTooltip
            hasPermission={canCreate}
            message="You need 'Create Projects' permission to add new projects. Contact your administrator."
          >
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? 'outline' : 'default'}
              disabled={!canCreate}
              className="w-auto"
            >
              {!canCreate && <Lock className="w-3.5 h-3.5 mr-2" />}
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{showCreateForm ? 'Cancel' : 'New Project'}</span>
              <span className="sm:hidden">{showCreateForm ? 'Cancel' : 'New'}</span>
            </Button>
          </PermissionTooltip>
        </div>

        {/* Filter Card */}
        <Card className="bg-card">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  placeholder="Search projects..."
                  className="w-full"
                />
              </div>

              {/* View Toggle */}
              <div className="bg-muted/50 p-1 rounded-lg flex items-center gap-1 border border-border/50 shrink-0">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 w-7 p-0 ${viewMode === 'grid' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 w-7 p-0 ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={() => window.location.reload()}
                className="shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 space-y-6">
        {/* Create Form */}
        {showCreateForm && (
          <Card className="shadow-sm border border-border bg-card mb-6">
            <CardHeader className="border-b border-border bg-muted/20">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <Sparkles className="w-4 h-4 text-primary" />
                Create New Project
              </CardTitle>
              <CardDescription>Fill in the details to create a new real estate project</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <ProjectForm
                onSubmit={handleCreate}
                onCancel={() => setShowCreateForm(false)}
                isSubmitting={submitting}
              />
            </CardContent>
          </Card>
        )}

        {/* Projects Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              [...Array(6)].map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card overflow-hidden">
                  <Skeleton className="h-48 w-full bg-slate-200" />
                  <div className="p-5 space-y-4">
                    <Skeleton className="h-6 w-3/4 rounded-md" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-4 w-2/3 rounded" />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="flex justify-between pt-4">
                      <Skeleton className="h-9 w-24 rounded-md" />
                      <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                  </div>
                </div>
              ))
            ) : projects.length === 0 ? (
              <div className="col-span-full text-center py-20 text-muted-foreground">
                <Building2 className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">No projects found</p>
                <p className="mt-1 text-sm">Create your first project to get started</p>
              </div>
            ) : (
              projects.map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={(p) => {
                    setEditingProject(p)
                    setEditOpen(true)
                  }}
                  onDelete={handleDelete}
                  onView={(p) => {
                    setViewingProject(p)
                    setViewOpen(true)
                  }}
                  onStartCampaign={(p) => {
                    // Navigate to Campaigns page filtered by project
                    router.push(`/dashboard/admin/crm/projects/${p.id}/campaigns`)
                  }}
                  deleting={deletingId === project.id}
                />
              ))
            )}
          </div>
        ) : (
          <div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center justify-between p-4 border border-border rounded-lg bg-card">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-12 w-16 rounded-md" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48 rounded" />
                        <Skeleton className="h-3 w-32 rounded" />
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                      <div className="flex gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-8 w-8 rounded-md" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ProjectList
                projects={projects}
                loading={loading}
                onEdit={(p) => {
                  setEditingProject(p)
                  setEditOpen(true)
                }}
                onDelete={handleDelete}
                onView={(p) => {
                  setViewingProject(p)
                  setViewOpen(true)
                }}
                onStartCampaign={(p) => {
                  setCampName(`Campaign for ${p.name}`)
                  setCampProjectId(p.id)
                  setAddOpen(true)
                }}
                deletingId={deletingId}
                page={page}
                onPageChange={setPage}
                hasMore={metadata.hasMore}
                isLoadingMore={isPlaceholderData}
              />
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto sm:rounded-xl">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              initialData={editingProject}
              onSubmit={handleUpdate}
              onCancel={() => setEditOpen(false)}
              isSubmitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Project Details Modal */}
      <Dialog open={!!viewingProject} onOpenChange={() => setViewingProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="mt-4">
              <div className="space-y-6">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shadow-sm relative group">
                  {viewingProject.image_url ? (
                    <img
                      src={viewingProject.image_url}
                      alt={viewingProject.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Building2 className="w-12 h-12 text-slate-300" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-white text-xl font-bold">{viewingProject.name}</h2>
                        {viewingProject.project_status && (
                          <Badge
                            variant={
                              viewingProject.project_status === 'ready_to_move' ? 'default' :
                                viewingProject.project_status === 'under_construction' ? 'secondary' :
                                  viewingProject.project_status === 'completed' ? 'outline' : 'secondary'
                            }
                            className={
                              viewingProject.project_status === 'ready_to_move' ? 'bg-green-600 text-white' :
                                viewingProject.project_status === 'under_construction' ? 'bg-yellow-600 text-white' :
                                  viewingProject.project_status === 'completed' ? 'bg-gray-600 text-white' : 'bg-blue-600 text-white'
                            }
                          >
                            {viewingProject.project_status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        )}
                        {viewingProject.project_type && (
                          <Badge variant="outline" className="bg-white/20 text-white border-white/40">
                            {viewingProject.project_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-white/90 text-sm">{viewingProject.address}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {viewingProject.description && (
                  <div className="bg-white p-4 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-900 mb-2">About This Project</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{viewingProject.description}</p>
                  </div>
                )}

                {(() => {
                  let meta = {}
                  try {
                    meta = typeof viewingProject.metadata === 'string'
                      ? JSON.parse(viewingProject.metadata)
                      : viewingProject.metadata || {}
                  } catch (e) {
                    console.error("Failed to parse metadata", e)
                  }
                  const re = meta.real_estate || {}
                  const prop = re.property || {}
                  const loc = re.location || {}
                  const price = re.pricing || {}
                  const res = prop.residential || {}
                  const comm = prop.commercial || {}
                  const land = prop.land || {}
                  const amenities = meta.amenities || []

                  // Use direct price_range column if available, fallback to metadata
                  const priceRange = viewingProject.price_range || price

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Inventory Stats Card */}
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100 space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b border-blue-200 pb-2 mb-2">Inventory Overview</h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <p className="text-slate-500 text-xs">Total Units</p>
                            <p className="font-bold text-2xl text-slate-900">{viewingProject.total_units || 0}</p>
                          </div>
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <p className="text-slate-500 text-xs">Available</p>
                            <p className="font-bold text-2xl text-green-600">{viewingProject.available_units || 0}</p>
                          </div>
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <p className="text-slate-500 text-xs">Sold</p>
                            <p className="font-bold text-2xl text-red-600">{viewingProject.sold_units || 0}</p>
                          </div>
                          <div className="bg-white p-3 rounded-md shadow-sm">
                            <p className="text-slate-500 text-xs">Reserved</p>
                            <p className="font-bold text-2xl text-yellow-600">{viewingProject.reserved_units || 0}</p>
                          </div>
                        </div>
                        {viewingProject.total_units > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-slate-600 mb-1">
                              <span>Occupancy</span>
                              <span>{Math.round(((viewingProject.sold_units + viewingProject.reserved_units) / viewingProject.total_units) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div className="h-full flex">
                                <div
                                  className="bg-red-500"
                                  style={{ width: `${(viewingProject.sold_units / viewingProject.total_units) * 100}%` }}
                                />
                                <div
                                  className="bg-yellow-500"
                                  style={{ width: `${(viewingProject.reserved_units / viewingProject.total_units) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Property Highlights */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Property Highlights</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Transaction</p>
                            <p className="font-medium text-slate-900 capitalize">{re.transaction || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Category</p>
                            <p className="font-medium text-slate-900 capitalize">
                              {[prop.category, prop.use_case].filter(Boolean).join(' - ') || 'N/A'}
                            </p>
                          </div>
                          {re.rera_number && (
                            <div className="col-span-2">
                              <p className="text-slate-500">RERA Number</p>
                              <p className="font-medium text-slate-900">{re.rera_number}</p>
                            </div>
                          )}
                          {priceRange.min && priceRange.max ? (
                            <div className="col-span-2">
                              <p className="text-slate-500">Price Range</p>
                              <p className="font-medium text-green-700 text-lg">
                                {`₹${priceRange.min.toLocaleString()} - ₹${priceRange.max.toLocaleString()}`}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {/* Location Card */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Location Details</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">City:</span>
                            <span className="font-medium text-slate-900">{loc.city || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Locality:</span>
                            <span className="font-medium text-slate-900">{loc.locality || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Landmark:</span>
                            <span className="font-medium text-slate-900">{loc.landmark || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Unit Types Breakdown */}
                      {viewingProject.unit_types && viewingProject.unit_types.length > 0 && (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                          <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Unit Configuration</h3>
                          <div className="space-y-2">
                            {viewingProject.unit_types.map((unit, idx) => (
                              <div key={idx} className="flex justify-between items-center py-2 px-3 bg-white rounded-md text-sm border border-slate-100">
                                <div className="flex-1">
                                  <p className="font-medium text-slate-900">{unit.configuration || unit.property_type}</p>
                                  {unit.carpet_area && (
                                    <p className="text-xs text-slate-500">{unit.carpet_area} sq.ft</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-slate-900">{unit.count} units</p>
                                  {unit.price && (
                                    <p className="text-xs text-green-600">₹{unit.price.toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Specifications */}
                      <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Specifications</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {res.bhk && (
                            <div>
                              <p className="text-slate-500">Configuration</p>
                              <p className="font-medium text-slate-900">{res.bhk}</p>
                            </div>
                          )}
                          {res.carpet_area > 0 && (
                            <div>
                              <p className="text-slate-500">Carpet Area</p>
                              <p className="font-medium text-slate-900">{res.carpet_area} sq.ft</p>
                            </div>
                          )}
                          {res.built_up_area > 0 && (
                            <div>
                              <p className="text-slate-500">Built-up Area</p>
                              <p className="font-medium text-slate-900">{res.built_up_area} sq.ft</p>
                            </div>
                          )}
                          {res.super_built_up_area > 0 && (
                            <div>
                              <p className="text-slate-500">Super Built-up</p>
                              <p className="font-medium text-slate-900">{res.super_built_up_area} sq.ft</p>
                            </div>
                          )}
                          {/* Commercial/Land Fallbacks */}
                          {comm.area > 0 && <div><p className="text-slate-500">Area</p><p className="font-medium">{comm.area} sq.ft</p></div>}
                          {(prop.plot_area > 0 || land.plot_area > 0) && <div><p className="text-slate-500">Plot Area</p><p className="font-medium">{prop.plot_area || land.plot_area} sq.ft</p></div>}
                        </div>
                      </div>

                      {/* Amenities */}
                      {amenities && amenities.length > 0 && (
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                          <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Amenities</h3>
                          <div className="flex flex-wrap gap-2">
                            {amenities.map((amenity, idx) => (
                              <Badge key={idx} variant="outline" className="bg-white">
                                {amenity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Campaign Modal (Simplified) */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Quick Campaign</DialogTitle>
            <DialogDescription>
              Launch a calling campaign for this project immediately.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCampaign} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Campaign Name</label>
              <Input
                value={campName}
                onChange={e => setCampName(e.target.value)}
                placeholder="e.g., Summer Sale Outreach"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={campStartDate}
                  onChange={e => setCampStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={campEndDate}
                  onChange={e => setCampEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Start Time</label>
                <Input
                  type="time"
                  value={campTimeStart}
                  onChange={e => setCampTimeStart(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily End Time</label>
                <Input
                  type="time"
                  value={campTimeEnd}
                  onChange={e => setCampTimeEnd(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Campaign'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
