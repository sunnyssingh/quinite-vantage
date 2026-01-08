'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Loader2,
  Building2,
  Home,
  MapPin,
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Eye,
  Upload,
  Plus,
  Store,
  LandPlot,
  Sparkles,
  Image as ImageIcon,
  Briefcase,
  TrendingUp,
  Ruler,
  Layers,
  CheckCircle2
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const PropertyCategoryIcon = ({ category }) => {
  const icons = {
    residential: <Home className="w-5 h-5" />,
    commercial: <Store className="w-5 h-5" />,
    land: <LandPlot className="w-5 h-5" />
  }
  return icons[category] || <Building2 className="w-5 h-5" />
}

const TransactionBadge = ({ transaction }) => {
  const colors = {
    sell: 'bg-blue-100 text-blue-800 border-blue-200',
    rent: 'bg-green-100 text-green-800 border-green-200',
    lease: 'bg-purple-100 text-purple-800 border-purple-200',
    pg: 'bg-orange-100 text-orange-800 border-orange-200'
  }
  return (
    <Badge className={`${colors[transaction]} border font-medium`}>
      {transaction?.toUpperCase()}
    </Badge>
  )
}

export default function ProjectsPage() {
  const supabase = createClient()
  const fileRef = useRef(null)
  const editFileRef = useRef(null)
  const router = useRouter()

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Create form states
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imagePath, setImagePath] = useState(null)
  const [transaction, setTransaction] = useState('sell')
  const [propertyCategory, setPropertyCategory] = useState('residential')
  const [propertyUseCase, setPropertyUseCase] = useState('apartment')
  const [bhk, setBhk] = useState('2bhk')
  const [carpetArea, setCarpetArea] = useState('')
  const [builtUpArea, setBuiltUpArea] = useState('')
  const [superBuiltUpArea, setSuperBuiltUpArea] = useState('')
  const [commercialArea, setCommercialArea] = useState('')
  const [commercialBuiltUpArea, setCommercialBuiltUpArea] = useState('')
  const [groundFloor, setGroundFloor] = useState(false)
  const [plotArea, setPlotArea] = useState('')
  const [locCity, setLocCity] = useState('')
  const [locLocality, setLocLocality] = useState('')
  const [locLandmark, setLocLandmark] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')

  // Edit modal states
  const [open, setOpen] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editImageUrl, setEditImageUrl] = useState('')
  const [editImagePath, setEditImagePath] = useState(null)
  const [editTransaction, setEditTransaction] = useState('sell')
  const [editPropertyCategory, setEditPropertyCategory] = useState('residential')
  const [editPropertyUseCase, setEditPropertyUseCase] = useState('apartment')
  const [editBhk, setEditBhk] = useState('2bhk')
  const [editCarpetArea, setEditCarpetArea] = useState('')
  const [editBuiltUpArea, setEditBuiltUpArea] = useState('')
  const [editSuperBuiltUpArea, setEditSuperBuiltUpArea] = useState('')
  const [editCommercialArea, setEditCommercialArea] = useState('')
  const [editCommercialBuiltUpArea, setEditCommercialBuiltUpArea] = useState('')
  const [editGroundFloor, setEditGroundFloor] = useState(false)
  const [editPlotArea, setEditPlotArea] = useState('')
  const [editLocCity, setEditLocCity] = useState('')
  const [editLocLocality, setEditLocLocality] = useState('')
  const [editLocLandmark, setEditLocLandmark] = useState('')
  const [editPriceMin, setEditPriceMin] = useState('')
  const [editPriceMax, setEditPriceMax] = useState('')
  const [deleting, setDeleting] = useState(false)

  // Campaign modal states
  const [addOpen, setAddOpen] = useState(false)
  const [campName, setCampName] = useState('')
  const [campDescription, setCampDescription] = useState('')
  const [campStartDate, setCampStartDate] = useState('')
  const [campEndDate, setCampEndDate] = useState('')
  const [campTimeStart, setCampTimeStart] = useState('')
  const [campTimeEnd, setCampTimeEnd] = useState('')
  const [campProjectId, setCampProjectId] = useState(null)



  // View modal states
  const [viewOpen, setViewOpen] = useState(false)
  const [viewingProject, setViewingProject] = useState(null)

  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (err) {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only images allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })

      setImageUrl(data.image_url)
      setImagePath(data.image_path)
      setSuccess('Image uploaded successfully!')
    } catch (err) {
      console.error(err)
      setError('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleEditImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Only images allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const res = await fetch('/api/projects/upload-url', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      await fetch(data.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      })

      setEditImageUrl(data.image_url)
      setEditImagePath(data.image_path)
      setSuccess('Image uploaded successfully!')
    } catch (err) {
      console.error(err)
      setError('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function createProject() {
    setError(null)
    setSuccess(null)

    if (!name || !locCity || !locLocality || !priceMin || !priceMax) {
      setError('Please fill in all required fields')
      return
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          address,
          image_url: imageUrl,
          image_path: imagePath,
          real_estate: {
            transaction,
            property: {
              category: propertyCategory,
              use_case: propertyUseCase,
              ...(propertyCategory === 'residential' ? {
                residential: {
                  bhk,
                  carpet_area: Number(carpetArea || 0),
                  built_up_area: Number(builtUpArea || 0),
                  super_built_up_area: Number(superBuiltUpArea || 0)
                }
              } : {}),
              ...(propertyCategory === 'commercial' ? {
                commercial: {
                  area: Number(commercialArea || 0),
                  built_up_area: Number(commercialBuiltUpArea || 0),
                  ground_floor: groundFloor
                }
              } : {}),
              ...(propertyCategory === 'land' ? {
                land: {
                  plot_area: Number(plotArea || 0)
                }
              } : {})
            },
            location: { city: locCity, locality: locLocality, landmark: locLandmark },
            pricing: { min: Number(priceMin || 0), max: Number(priceMax || 0) },
            media: { thumbnail: imageUrl || null },
            description: description || ''
          }
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }

      setProjects(prev => [data.project, ...prev])
      setSuccess('Project created successfully!')

      // Reset form
      setName('')
      setDescription('')
      setAddress('')
      setImageUrl('')
      setImagePath(null)
      setLocCity('')
      setLocLocality('')
      setLocLandmark('')
      setPriceMin('')
      setPriceMax('')
      setCarpetArea('')
      setBuiltUpArea('')
      setSuperBuiltUpArea('')
      setCommercialArea('')
      setCommercialBuiltUpArea('')
      setPlotArea('')
      setShowCreateForm(false)

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Failed to create project')
    }
  }

  async function handleDelete(project) {
    if (!confirm('Delete this project? This cannot be undone.')) return

    setDeleting(true)
    setError(null)

    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Delete failed')

      setProjects(prev => prev.filter(p => p.id !== project.id))
      setSuccess('Project deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  function openEditModal(project) {
    setEditingProject(project)
    setEditName(project.name || '')
    setEditDescription(project.description || '')
    setEditAddress(project.address || '')
    setEditImageUrl(project.image_url || '')
    setEditImagePath(project.image_path || null)

    const re = project?.metadata?.real_estate || project?.real_estate || null
    if (re) {
      setEditTransaction(re.transaction || 'sell')
      setEditPropertyCategory(re.property?.category || 'residential')
      setEditPropertyUseCase(re.property?.use_case || '')
      setEditLocCity(re.location?.city || '')
      setEditLocLocality(re.location?.locality || '')
      setEditLocLandmark(re.location?.landmark || '')
      setEditPriceMin(re.pricing?.min || '')
      setEditPriceMax(re.pricing?.max || '')

      if (re.property?.residential) {
        setEditBhk(re.property.residential.bhk || '2bhk')
        setEditCarpetArea(re.property.residential.carpet_area || '')
        setEditBuiltUpArea(re.property.residential.built_up_area || '')
        setEditSuperBuiltUpArea(re.property.residential.super_built_up_area || '')
      }
      if (re.property?.commercial) {
        setEditCommercialArea(re.property.commercial.area || '')
        setEditCommercialBuiltUpArea(re.property.commercial.built_up_area || '')
        setEditGroundFloor(re.property.commercial.ground_floor || false)
      }
      if (re.property?.land) {
        setEditPlotArea(re.property.land.plot_area || '')
      }
    }

    setOpen(true)
  }

  function openViewModal(project) {
    setViewingProject(project)
    setViewOpen(true)
  }

  async function handleUpdate() {
    if (!editingProject) return

    setError(null)
    setSuccess(null)

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          address: editAddress,
          image_url: editImageUrl,
          image_path: editImagePath,
          real_estate: {
            transaction: editTransaction,
            property: {
              category: editPropertyCategory,
              use_case: editPropertyUseCase,
              ...(editPropertyCategory === 'residential' ? {
                residential: {
                  bhk: editBhk,
                  carpet_area: Number(editCarpetArea || 0),
                  built_up_area: Number(editBuiltUpArea || 0),
                  super_built_up_area: Number(editSuperBuiltUpArea || 0)
                }
              } : {}),
              ...(editPropertyCategory === 'commercial' ? {
                commercial: {
                  area: Number(editCommercialArea || 0),
                  built_up_area: Number(editCommercialBuiltUpArea || 0),
                  ground_floor: editGroundFloor
                }
              } : {}),
              ...(editPropertyCategory === 'land' ? {
                land: {
                  plot_area: Number(editPlotArea || 0)
                }
              } : {})
            },
            location: { city: editLocCity, locality: editLocLocality, landmark: editLocLandmark },
            pricing: { min: Number(editPriceMin || 0), max: Number(editPriceMax || 0) },
            media: { thumbnail: editImageUrl || null },
            description: editDescription || ''
          }
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')

      setProjects(prev => prev.map(p => p.id === data.project.id ? data.project : p))
      setOpen(false)
      setSuccess('Project updated successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error(err)
      setError(err.message || 'Update failed')
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            My Projects
          </h1>
          <p className="text-slate-600 mt-1">Manage your real estate projects and campaigns</p>
        </div>

        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Project
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
        <Card className="shadow-xl border-2 border-blue-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Create New Project
            </CardTitle>
            <CardDescription>Fill in the details to create a new real estate project</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="basic" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="property" className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Property
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Pricing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    Project Name *
                  </label>
                  <Input
                    placeholder="e.g., Sunrise Apartments"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Address
                  </label>
                  <Input
                    placeholder="e.g., 123 Main Street"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="border-slate-300"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">
                    Description
                  </label>
                  <Textarea
                    placeholder="Describe your project (minimum 50 characters)..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="border-slate-300"
                  />
                  <p className="text-xs text-slate-500 mt-1">{description.length}/50 characters minimum</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    Project Image
                  </label>
                  <input
                    type="file"
                    ref={fileRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleCreateImageUpload}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-dashed border-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Image
                      </>
                    )}
                  </Button>
                  {imageUrl && (
                    <div className="mt-3 relative">
                      <img
                        src={imageUrl}
                        alt="preview"
                        className="h-48 w-full object-cover rounded-lg border-2 border-slate-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="property" className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Transaction Type</label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                      value={transaction}
                      onChange={e => setTransaction(e.target.value)}
                    >
                      <option value="sell">Sell</option>
                      <option value="rent">Rent</option>
                      <option value="lease">Lease</option>
                      <option value="pg">PG</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                      value={propertyCategory}
                      onChange={e => setPropertyCategory(e.target.value)}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="land">Land</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1.5 block">Use Case</label>
                    <select
                      className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                      value={propertyUseCase}
                      onChange={e => setPropertyUseCase(e.target.value)}
                    >
                      <option value="apartment">Apartment</option>
                      <option value="builder_floor">Builder Floor</option>
                      <option value="independent_house">Independent House</option>
                      <option value="villa_bungalow">Villa / Bungalow</option>
                      <option value="row_house">Row House</option>
                      <option value="studio">Studio</option>
                      <option value="penthouse">Penthouse</option>
                      <option value="farm_house">Farm House</option>
                      <option value="service_apartment">Service Apartment</option>
                      <option value="office">Office</option>
                      <option value="retail">Retail</option>
                      <option value="residential_plot">Residential Plot</option>
                    </select>
                  </div>
                </div>

                {propertyCategory === 'residential' && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4 text-blue-600" />
                      Residential Details
                    </h4>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">BHK</label>
                        <select
                          value={bhk}
                          onChange={e => setBhk(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white"
                        >
                          <option value="1rk">1RK</option>
                          <option value="1bhk">1BHK</option>
                          <option value="2bhk">2BHK</option>
                          <option value="3bhk">3BHK</option>
                          <option value="4bhk">4BHK</option>
                          <option value="5plus">5+</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Carpet Area (sqft)</label>
                        <Input
                          type="number"
                          placeholder="1200"
                          value={carpetArea}
                          onChange={e => setCarpetArea(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Built-up Area</label>
                        <Input
                          type="number"
                          placeholder="1400"
                          value={builtUpArea}
                          onChange={e => setBuiltUpArea(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Super Built-up</label>
                        <Input
                          type="number"
                          placeholder="1600"
                          value={superBuiltUpArea}
                          onChange={e => setSuperBuiltUpArea(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {propertyCategory === 'commercial' && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <Store className="w-4 h-4 text-purple-600" />
                      Commercial Details
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Area (sqft)</label>
                        <Input
                          type="number"
                          placeholder="2000"
                          value={commercialArea}
                          onChange={e => setCommercialArea(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Built-up Area</label>
                        <Input
                          type="number"
                          placeholder="2200"
                          value={commercialBuiltUpArea}
                          onChange={e => setCommercialBuiltUpArea(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={groundFloor}
                            onChange={e => setGroundFloor(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-slate-700">Ground Floor</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {propertyCategory === 'land' && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                      <LandPlot className="w-4 h-4 text-green-600" />
                      Land Details
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Plot Area (sqft)</label>
                        <Input
                          type="number"
                          placeholder="5000"
                          value={plotArea}
                          onChange={e => setPlotArea(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="location" className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Location Details
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">City *</label>
                      <Input
                        placeholder="Mumbai"
                        value={locCity}
                        onChange={e => setLocCity(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Locality *</label>
                      <Input
                        placeholder="Andheri West"
                        value={locLocality}
                        onChange={e => setLocLocality(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Landmark</label>
                      <Input
                        placeholder="Near Metro Station"
                        value={locLandmark}
                        onChange={e => setLocLandmark(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Price Range
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Minimum Price *</label>
                      <Input
                        type="number"
                        placeholder="5000000"
                        value={priceMin}
                        onChange={e => setPriceMin(e.target.value)}
                        className="text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">₹ {Number(priceMin || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 mb-1.5 block">Maximum Price *</label>
                      <Input
                        type="number"
                        placeholder="8000000"
                        value={priceMax}
                        onChange={e => setPriceMax(e.target.value)}
                        className="text-lg"
                      />
                      <p className="text-xs text-slate-500 mt-1">₹ {Number(priceMax || 0).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={createProject}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-slate-600">Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <Card className="py-20">
          <CardContent className="text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No projects yet</h3>
            <p className="text-slate-600 mb-4">Create your first project to get started</p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map(project => {
            const re = project?.metadata?.real_estate || project?.real_estate || {}
            return (
              <Card key={project.id} className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-200">
                <div className="relative">
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-48 w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    </div>
                  )}

                  {/* Transaction Badge */}
                  {re.transaction && (
                    <div className="absolute top-3 left-3">
                      <TransactionBadge transaction={re.transaction} />
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditModal(project)}
                      className="shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(project)}
                      disabled={deleting}
                      className="shadow-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                        {re.property?.category && <PropertyCategoryIcon category={re.property.category} />}
                        {project.name}
                      </h3>
                      {re.location?.city && (
                        <p className="text-sm text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          {re.location.city}{re.location.locality && `, ${re.location.locality}`}
                        </p>
                      )}
                    </div>
                    {re.property?.category && (
                      <Badge variant="outline" className="shrink-0">
                        {re.property.category}
                      </Badge>
                    )}
                  </div>

                  {project.description && (
                    <p className="text-sm text-slate-700 line-clamp-2">{project.description}</p>
                  )}

                  {/* Property Details */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {re.property?.residential?.bhk && (
                      <Badge variant="secondary" className="text-xs">
                        <Home className="w-3 h-3 mr-1" />
                        {re.property.residential.bhk.toUpperCase()}
                      </Badge>
                    )}
                    {re.property?.residential?.carpet_area && (
                      <Badge variant="secondary" className="text-xs">
                        <Ruler className="w-3 h-3 mr-1" />
                        {re.property.residential.carpet_area} sqft
                      </Badge>
                    )}
                  </div>

                  {/* Pricing */}
                  {re.pricing?.min && re.pricing?.max && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          Price Range
                        </span>
                        <span className="text-sm font-bold text-green-600">
                          ₹{Number(re.pricing.min).toLocaleString('en-IN')} - ₹{Number(re.pricing.max).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-3 flex items-center justify-between border-t">
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {project.created_at ? new Date(project.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCampProjectId(project.id)
                          setCampName('')
                          setCampDescription('')
                          setCampStartDate('')
                          setCampEndDate('')
                          setCampTimeStart('09:00')
                          setCampTimeEnd('17:00')
                          setAddOpen(true)
                        }}
                      >
                        <Briefcase className="w-4 h-4 mr-1" />
                        Campaign
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewModal(project)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Project
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Project Name</label>
              <Input
                placeholder="Project name"
                value={editName}
                onChange={e => setEditName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Address</label>
              <Input
                placeholder="Address"
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <Textarea
                placeholder="Description"
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Transaction</label>
                <select
                  className="w-full rounded-md border px-2 py-2"
                  value={editTransaction}
                  onChange={e => setEditTransaction(e.target.value)}
                >
                  <option value="sell">Sell</option>
                  <option value="rent">Rent</option>
                  <option value="lease">Lease</option>
                  <option value="pg">PG</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Category</label>
                <select
                  className="w-full rounded-md border px-2 py-2"
                  value={editPropertyCategory}
                  onChange={e => setEditPropertyCategory(e.target.value)}
                >
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="land">Land</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700 mb-1.5 block">Use Case</label>
                <select
                  className="w-full rounded-md border px-2 py-2"
                  value={editPropertyUseCase}
                  onChange={e => setEditPropertyUseCase(e.target.value)}
                >
                  <option value="apartment">Apartment</option>
                  <option value="builder_floor">Builder Floor</option>
                  <option value="independent_house">Independent House</option>
                  <option value="villa_bungalow">Villa / Bungalow</option>
                  <option value="row_house">Row House</option>
                  <option value="studio">Studio</option>
                  <option value="penthouse">Penthouse</option>
                  <option value="farm_house">Farm House</option>
                  <option value="service_apartment">Service Apartment</option>
                </select>
              </div>
            </div>

            {editPropertyCategory === 'residential' && (
              <div className="grid grid-cols-4 gap-2">
                <select
                  value={editBhk}
                  onChange={e => setEditBhk(e.target.value)}
                  className="rounded-md border px-2 py-1"
                >
                  <option value="1rk">1RK</option>
                  <option value="1bhk">1BHK</option>
                  <option value="2bhk">2BHK</option>
                  <option value="3bhk">3BHK</option>
                  <option value="4bhk">4BHK</option>
                  <option value="5plus">5+</option>
                </select>
                <Input
                  placeholder="Carpet area"
                  value={editCarpetArea}
                  onChange={e => setEditCarpetArea(e.target.value)}
                />
                <Input
                  placeholder="Built-up"
                  value={editBuiltUpArea}
                  onChange={e => setEditBuiltUpArea(e.target.value)}
                />
                <Input
                  placeholder="Super built-up"
                  value={editSuperBuiltUpArea}
                  onChange={e => setEditSuperBuiltUpArea(e.target.value)}
                />
              </div>
            )}

            {editPropertyCategory === 'commercial' && (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  placeholder="Area"
                  value={editCommercialArea}
                  onChange={e => setEditCommercialArea(e.target.value)}
                />
                <Input
                  placeholder="Built-up"
                  value={editCommercialBuiltUpArea}
                  onChange={e => setEditCommercialBuiltUpArea(e.target.value)}
                />
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editGroundFloor}
                    onChange={e => setEditGroundFloor(e.target.checked)}
                  />
                  Ground floor
                </label>
              </div>
            )}

            {editPropertyCategory === 'land' && (
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Plot area"
                  value={editPlotArea}
                  onChange={e => setEditPlotArea(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="City"
                value={editLocCity}
                onChange={e => setEditLocCity(e.target.value)}
              />
              <Input
                placeholder="Locality"
                value={editLocLocality}
                onChange={e => setEditLocLocality(e.target.value)}
              />
              <Input
                placeholder="Landmark"
                value={editLocLandmark}
                onChange={e => setEditLocLandmark(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Price min"
                value={editPriceMin}
                onChange={e => setEditPriceMin(e.target.value)}
              />
              <Input
                placeholder="Price max"
                value={editPriceMax}
                onChange={e => setEditPriceMax(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Image</label>
              <input
                type="file"
                ref={editFileRef}
                accept="image/*"
                className="hidden"
                onChange={handleEditImageUpload}
                disabled={uploading}
              />
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => editFileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>

                {editImageUrl && !uploading && (
                  <img
                    src={editImageUrl}
                    alt="preview"
                    className="h-20 rounded-md border object-cover"
                  />
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!editingProject) return
                await handleDelete(editingProject)
                setOpen(false)
              }}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
            <Button
              onClick={handleUpdate}
              className="bg-gradient-to-r from-blue-600 to-indigo-600"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Campaign Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              Create Campaign
            </DialogTitle>
            <CardDescription>Schedule a new outbound call campaign for this project</CardDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Project Summary Card */}
            {(() => {
              const project = projects.find(p => p.id === campProjectId)
              if (!project) return null
              const re = project.metadata?.real_estate || project.real_estate || {}

              return (
                <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-sm group">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100/50" />

                  {/* Background Image with Overlay */}
                  {project.image_url && (
                    <div className="absolute inset-0 opacity-10">
                      <img src={project.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="relative p-4 flex gap-4">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-white shadow-md bg-slate-100">
                      {project.image_url ? (
                        <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 truncate">{project.name}</h4>
                          {re.location?.city && (
                            <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {re.location.city}{re.location.locality && `, ${re.location.locality}`}
                            </p>
                          )}
                        </div>
                        {re.property?.category && (
                          <Badge variant="outline" className="bg-white/50 backdrop-blur-sm">
                            {re.property.category}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-3 text-xs">
                        {re.pricing?.min && (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 font-medium">
                            <DollarSign className="w-3 h-3" />
                            ₹{Number(re.pricing.min).toLocaleString('en-IN')} - ₹{Number(re.pricing.max).toLocaleString('en-IN')}
                          </div>
                        )}
                        {re.transaction && (
                          <Badge variant="secondary" className="capitalize">
                            {re.transaction}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()}

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Campaign Name *</label>
              <Input
                placeholder="e.g., Summer Promotion"
                value={campName}
                onChange={e => setCampName(e.target.value)}
                className="border-slate-300"
              />
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                Campaign Schedule
              </h4>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Date *</label>
                  <Input
                    type="date"
                    value={campStartDate}
                    onChange={e => setCampStartDate(e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Date *</label>
                  <Input
                    type="date"
                    value={campEndDate}
                    onChange={e => setCampEndDate(e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 mt-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">Start Time *</label>
                  <Input
                    type="time"
                    value={campTimeStart}
                    onChange={e => setCampTimeStart(e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-1.5 block">End Time *</label>
                  <Input
                    type="time"
                    value={campTimeEnd}
                    onChange={e => setCampTimeEnd(e.target.value)}
                    className="bg-white border-slate-300"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-1.5 block">Description</label>
              <Textarea
                placeholder="Describe the purpose of this campaign..."
                value={campDescription}
                onChange={e => setCampDescription(e.target.value)}
                rows={3}
                className="border-slate-300"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                setError(null)
                if (!campProjectId || !campName || !campStartDate || !campEndDate || !campTimeStart || !campTimeEnd) {
                  setError('Please fill in all required fields')
                  return
                }

                try {
                  const res = await fetch('/api/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      project_id: campProjectId,
                      name: campName,
                      description: campDescription,
                      start_date: campStartDate,
                      end_date: campEndDate,
                      time_start: campTimeStart,
                      time_end: campTimeEnd
                    })
                  })

                  const data = await res.json()
                  if (!res.ok) throw new Error(data.error || 'Create failed')

                  setAddOpen(false)
                  setSuccess('Campaign created successfully!')
                  setTimeout(() => setSuccess(null), 3000)
                } catch (err) {
                  console.error(err)
                  setError(err.message || 'Create failed')
                }
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* View Project Modal */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 gap-0">
          {viewingProject && (() => {
            const re = viewingProject.metadata?.real_estate || viewingProject.real_estate || {}
            return (
              <div className="flex flex-col h-full">
                {/* Hero Image */}
                <div className="relative h-64 w-full bg-slate-100">
                  {viewingProject.image_url ? (
                    <img
                      src={viewingProject.image_url}
                      alt={viewingProject.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
                      <Building2 className="w-16 h-16 text-blue-200" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                  <div className="absolute bottom-0 left-0 p-6 text-white w-full">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          {re.transaction && (
                            <Badge className="bg-white/20 hover:bg-white/30 backdrop-blur-md border-transparent text-white">
                              {re.transaction.toUpperCase()}
                            </Badge>
                          )}
                          {re.property?.category && (
                            <Badge variant="outline" className="text-white border-white/40 bg-black/20 backdrop-blur-md">
                              {re.property.category}
                            </Badge>
                          )}
                        </div>
                        <h2 className="text-3xl font-bold mb-1">{viewingProject.name}</h2>
                        {re.location?.city && (
                          <p className="text-white/90 flex items-center gap-1.5 text-lg">
                            <MapPin className="w-4 h-4" />
                            {re.location.city}{re.location.locality && `, ${re.location.locality}`}
                          </p>
                        )}
                      </div>

                      <Button
                        size="icon"
                        variant="secondary"
                        className="rounded-full h-10 w-10 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border-none shadow-lg"
                        onClick={() => {
                          setViewOpen(false)
                          openEditModal(viewingProject)
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-8">
                  {/* Key Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-sm text-blue-600 font-medium mb-1">Price Range</p>
                      <p className="text-lg font-bold text-slate-900">
                        {re.pricing?.min ? `₹${Number(re.pricing.min).toLocaleString('en-IN')}` : 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">Min Price</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                      <p className="text-sm text-purple-600 font-medium mb-1">Configuration</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">
                        {re.property?.residential?.bhk || re.property?.use_case?.replace('_', ' ') || 'N/A'}
                      </p>
                      <p className="text-xs text-slate-500">Type</p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-50 border border-green-100">
                      <p className="text-sm text-green-600 font-medium mb-1">Area</p>
                      <p className="text-lg font-bold text-slate-900">
                        {re.property?.residential?.carpet_area || re.property?.commercial?.area || re.property?.land?.plot_area || '—'}
                      </p>
                      <p className="text-xs text-slate-500">Sq. Ft.</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                      <p className="text-sm text-orange-600 font-medium mb-1">Status</p>
                      <p className="text-lg font-bold text-slate-900">Active</p>
                      <p className="text-xs text-slate-500">Project Status</p>
                    </div>
                  </div>

                  {/* Description */}
                  {viewingProject.description && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-600" />
                        About Project
                      </h3>
                      <p className="text-slate-600 leading-relaxed">
                        {viewingProject.description}
                      </p>
                    </div>
                  )}

                  {/* Detailed Specs */}
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Property Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Category</span>
                          <span className="font-medium text-slate-900 capitalize">{re.property?.category || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Use Case</span>
                          <span className="font-medium text-slate-900 capitalize">{re.property?.use_case?.replace(/_/g, ' ') || '—'}</span>
                        </div>
                        {re.property?.residential && (
                          <>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Built-up Area</span>
                              <span className="font-medium text-slate-900">{re.property.residential.built_up_area} sqft</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-slate-100">
                              <span className="text-slate-500">Super Built-up</span>
                              <span className="font-medium text-slate-900">{re.property.residential.super_built_up_area} sqft</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Location & Address
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">City</span>
                          <span className="font-medium text-slate-900">{re.location?.city || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Locality</span>
                          <span className="font-medium text-slate-900">{re.location?.locality || '—'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-slate-100">
                          <span className="text-slate-500">Landmark</span>
                          <span className="font-medium text-slate-900">{re.location?.landmark || '—'}</span>
                        </div>
                        {viewingProject.address && (
                          <div className="pt-2">
                            <span className="text-slate-500 block mb-1">Full Address</span>
                            <span className="font-medium text-slate-900">{viewingProject.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setViewOpen(false)}>Close</Button>
                  <Button
                    className="bg-gradient-to-r from-blue-600 to-indigo-600"
                    onClick={() => {
                      setViewOpen(false)
                      setCampProjectId(viewingProject.id)
                      setAddOpen(true)
                    }}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
