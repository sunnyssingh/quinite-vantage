'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Loader2, Upload, X, Image as ImageIcon, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function EditPropertyModal({ property, isOpen, onClose, onPropertyUpdated, onActionComplete }) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [projects, setProjects] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        type: '',
        status: 'available',
        project_id: 'none',
        images: []
    })
    const fileInputRef = useRef(null)
    const supabase = createClient()

    useEffect(() => {
        if (isOpen) {
            fetchProjects()
        }
    }, [isOpen])

    useEffect(() => {
        if (property) {
            setFormData({
                title: property.title || '',
                description: property.description || '',
                address: property.address || '',
                price: property.price || '',
                bedrooms: property.bedrooms || '',
                bathrooms: property.bathrooms || '',
                area: property.size_sqft || '',
                type: property.type || '',
                status: property.status || 'available',
                project_id: property.project_id || 'none',
                images: property.images || []
            })
        } else {
            // Reset for Add New
            setFormData({
                title: '',
                description: '',
                address: '',
                price: '',
                bedrooms: '',
                bathrooms: '',
                area: '',
                type: '',
                status: 'available',
                project_id: 'none',
                images: []
            })
        }
    }, [property, isOpen])

    const fetchProjects = async () => {
        try {
            const res = await fetch('/api/inventory/projects')
            const data = await res.json()
            if (res.ok) {
                setProjects(data.projects || [])
            }
        } catch (error) {
            console.error('Failed to fetch projects', error)
        }
    }

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        setUploading(true)
        const toastId = toast.loading('Uploading images...')

        try {
            const newImages = []

            for (const file of files) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('property-images')
                    .upload(filePath, file)

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('property-images')
                    .getPublicUrl(filePath)

                newImages.push({
                    url: publicUrl,
                    is_featured: false
                })
            }

            setFormData(prev => ({
                ...prev,
                images: [...prev.images, ...newImages]
            }))
            toast.success('Images uploaded', { id: toastId })
        } catch (error) {
            console.error('Upload error:', error)
            toast.error('Failed to upload images. Check storage bucket setup.', { id: toastId })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }))
    }

    const setFeaturedImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.map((img, i) => ({
                ...img,
                is_featured: i === index
            }))
        }))
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this property? This action cannot be undone.')) return

        setDeleting(true)
        try {
            const res = await fetch(`/api/inventory/properties/${property.id}`, {
                method: 'DELETE'
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to delete')
            }

            toast.success('Property deleted successfully')
            if (onActionComplete) onActionComplete()
            onClose()
        } catch (error) {
            console.error('Delete error:', error)
            toast.error(error.message || 'Failed to delete property')
        } finally {
            setDeleting(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            const isNew = !property?.id
            const url = isNew
                ? `/api/inventory/properties`
                : `/api/inventory/properties/${property.id}`

            const method = isNew ? 'POST' : 'PATCH'

            const payload = {
                title: formData.title,
                description: formData.description,
                address: formData.address,
                price: formData.price ? Number(formData.price) : null,
                bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
                size: formData.area ? Number(formData.area) : null, // standardized to size in backend
                type: formData.type,
                status: formData.status,
                projectId: formData.project_id === 'none' ? null : formData.project_id,
                images: formData.images
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to update property')
            }

            toast.success(isNew ? 'Property created successfully' : 'Property updated successfully')

            if (onPropertyUpdated) {
                onPropertyUpdated(data.property)
            }
            if (onActionComplete) onActionComplete()

            onClose()
        } catch (error) {
            console.error('Update property error:', error)
            toast.error(error.message || 'Failed to update property')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto w-full">
                <DialogHeader>
                    <DialogTitle>{property?.id ? 'Edit Property' : 'Add Property'}</DialogTitle>
                    <DialogDescription>
                        {property?.id ? 'Update property details and images' : 'Create a new property listing'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column: Basic Details */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Property Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                    placeholder="e.g., Luxury 3BHK Apartment"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="project">Project</Label>
                                <Select
                                    value={formData.project_id}
                                    onValueChange={(val) => setFormData(prev => ({ ...prev, project_id: val }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Project (Optional)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Project</SelectItem>
                                        {projects.map(p => (
                                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type *</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}
                                        required
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="apartment">Apartment</SelectItem>
                                            <SelectItem value="villa">Villa</SelectItem>
                                            <SelectItem value="plot">Plot</SelectItem>
                                            <SelectItem value="commercial">Commercial</SelectItem>
                                            <SelectItem value="penthouse">Penthouse</SelectItem>
                                            <SelectItem value="studio">Studio</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="available">Available</SelectItem>
                                            <SelectItem value="sold">Sold</SelectItem>
                                            <SelectItem value="reserved">Reserved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                                    placeholder="e.g., 5000000"
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    value={formData.address}
                                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Property address..."
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Right Column: Specs & Images */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="bedrooms">Beds</Label>
                                    <Input
                                        id="bedrooms"
                                        type="number"
                                        value={formData.bedrooms}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bedrooms: e.target.value }))}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bathrooms">Baths</Label>
                                    <Input
                                        id="bathrooms"
                                        type="number"
                                        value={formData.bathrooms}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bathrooms: e.target.value }))}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="area">Sq Ft</Label>
                                    <Input
                                        id="area"
                                        type="number"
                                        value={formData.area}
                                        onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Full description..."
                                    rows={3}
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {formData.images.map((img, index) => (
                                        <div key={index} className="relative aspect-square rounded-md overflow-hidden border border-border group bg-muted">
                                            <img
                                                src={img.url}
                                                alt={`Property ${index}`}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={img.is_featured ? "default" : "secondary"}
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => setFeaturedImage(index)}
                                                    title="Set as Featured"
                                                >
                                                    <ImageIcon className="w-3 h-3" />
                                                </Button>
                                            </div>
                                            {img.is_featured && (
                                                <div className="absolute top-1 left-1 bg-blue-600 text-[10px] text-white px-1.5 rounded-sm">Featured</div>
                                            )}
                                        </div>
                                    ))}
                                    <div
                                        className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-blue-500/50 hover:bg-blue-50/50 transition-colors flex flex-col items-center justify-center cursor-pointer"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                        {uploading ? (
                                            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
                                        ) : (
                                            <>
                                                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                                                <span className="text-xs text-muted-foreground">Upload</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between items-center w-full">
                        {property?.id && (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={loading || uploading || deleting}
                            >
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading || deleting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || uploading || deleting} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto sm:min-w-[120px]">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {property?.id ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    property?.id ? 'Update Property' : 'Create Property'
                                )}
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
