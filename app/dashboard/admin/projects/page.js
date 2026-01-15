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
import { Building2, Plus, Sparkles, Loader2, Briefcase } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectForm from '@/components/projects/ProjectForm'

export default function ProjectsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Edit State
  const [editOpen, setEditOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)

  // View State
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingProject, setViewingProject] = useState(null)

  // Campaign State
  const [addOpen, setAddOpen] = useState(false)
  const [campName, setCampName] = useState('')
  const [campProjectId, setCampProjectId] = useState(null)

  // Delete State
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load projects"
      })
    } finally {
      setLoading(false)
    }
  }

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
        real_estate: {
          transaction: formData.transaction,
          property: {
            category: formData.propertyCategory,
            use_case: formData.propertyUseCase,
            ...(formData.propertyCategory === 'residential' ? {
              residential: {
                bhk: formData.bhk,
                carpet_area: Number(formData.carpetArea || 0),
                built_up_area: Number(formData.builtUpArea || 0),
                super_built_up_area: Number(formData.superBuiltUpArea || 0)
              }
            } : {}),
            ...(formData.propertyCategory === 'commercial' ? {
              commercial: {
                area: Number(formData.commercialArea || 0),
                built_up_area: Number(formData.commercialBuiltUpArea || 0),
                ground_floor: formData.groundFloor
              }
            } : {}),
            ...(formData.propertyCategory === 'land' ? {
              land: {
                plot_area: Number(formData.plotArea || 0)
              }
            } : {})
          },
          location: { city: formData.locCity, locality: formData.locLocality, landmark: formData.locLandmark },
          pricing: { min: Number(formData.priceMin || 0), max: Number(formData.priceMax || 0) },
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

      setProjects(prev => [data.project, ...prev])
      toast({ title: "Success", description: "Project created successfully!" })
      setShowCreateForm(false)
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create project" })
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
        real_estate: {
          transaction: formData.transaction,
          property: {
            category: formData.propertyCategory,
            use_case: formData.propertyUseCase,
            ...(formData.propertyCategory === 'residential' ? {
              residential: {
                bhk: formData.bhk,
                carpet_area: Number(formData.carpetArea || 0),
                built_up_area: Number(formData.builtUpArea || 0),
                super_built_up_area: Number(formData.superBuiltUpArea || 0)
              }
            } : {}),
            ...(formData.propertyCategory === 'commercial' ? {
              commercial: {
                area: Number(formData.commercialArea || 0),
                built_up_area: Number(formData.commercialBuiltUpArea || 0),
                ground_floor: formData.groundFloor
              }
            } : {}),
            ...(formData.propertyCategory === 'land' ? {
              land: {
                plot_area: Number(formData.plotArea || 0)
              }
            } : {})
          },
          location: { city: formData.locCity, locality: formData.locLocality, landmark: formData.locLandmark },
          pricing: { min: Number(formData.priceMin || 0), max: Number(formData.priceMax || 0) },
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

      setProjects(prev => prev.map(p => p.id === data.project.id ? data.project : p))
      setEditOpen(false)
      toast({ title: "Success", description: "Project updated successfully!" })
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Update failed" })
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

      setProjects(prev => prev.filter(p => p.id !== project.id))
      toast({ title: "Success", description: "Project deleted successfully!" })
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Delete failed" })
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
          start_date: new Date().toISOString(), // Default valid range
          end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
          daily_start_time: '09:00',
          daily_end_time: '18:00',
          max_calls_per_day: 100
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      toast({ title: "Success", description: "Campaign created successfully!" })
      setAddOpen(false)
      setCampName('')
      setCampProjectId(null)
      router.push('/dashboard/campaigns')
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Building2 className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            My Projects
          </h1>
          <p className="text-slate-600 mt-1 text-sm md:text-base">Manage your real estate projects and campaigns</p>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          {showCreateForm ? 'Cancel Creation' : 'New Project'}
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="shadow-xl border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Create New Project
            </CardTitle>
            <CardDescription>Fill in the details to create a new real estate project</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <ProjectForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreateForm(false)}
              isSubmitting={submitting}
            />
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <Card key={i} className="h-[400px] animate-pulse bg-slate-100" />
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full text-center py-20 text-slate-500">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-medium">No projects found</p>
            <p className="mt-2">Create your first project to get started</p>
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
                setCampProjectId(p.id)
                setAddOpen(true)
              }}
              deleting={deletingId === project.id}
            />
          ))
        )}
      </div>

      {/* Edit Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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

      {/* View Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-4">
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
                    <div>
                      <h2 className="text-white text-xl font-bold">{viewingProject.name}</h2>
                      <p className="text-white/90 text-sm">{viewingProject.address}</p>
                    </div>
                  </div>
                </div>

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

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Key Info Card */}
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                        <h3 className="font-semibold text-slate-900 border-b pb-2 mb-2">Property Highlights</h3>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-500">Transaction</p>
                            <p className="font-medium text-slate-900 capitalize">{re.transaction || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-slate-500">Type</p>
                            <p className="font-medium text-slate-900 capitalize">
                              {[prop.category, prop.use_case].filter(Boolean).join(' - ') || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500">Price Range</p>
                            <p className="font-medium text-green-700">
                              {price.min && price.max
                                ? `₹${price.min.toLocaleString()} - ₹${price.max.toLocaleString()}`
                                : 'Price on Request'}
                            </p>
                          </div>
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
                          {land.plot_area > 0 && <div><p className="text-slate-500">Plot Area</p><p className="font-medium">{land.plot_area} sq.ft</p></div>}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="md:col-span-2">
                        <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                        <p className="text-slate-600 text-sm leading-relaxed border-l-4 border-blue-100 pl-4 py-1">
                          {viewingProject.description || 'No description provided.'}
                        </p>
                      </div>
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
