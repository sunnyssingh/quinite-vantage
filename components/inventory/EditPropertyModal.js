'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Loader2, Upload, X, Image as ImageIcon, Trash2, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function EditPropertyModal({ property, isOpen, onClose, onPropertyUpdated, onActionComplete }) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [projects, setProjects] = useState([])
    const [towers, setTowers] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        address: '',
        price: '',
        base_price: '',
        floor_rise_price: '',
        plc_price: '',
        bedrooms: '',
        bathrooms: '',
        area: '',
        type: 'apartment',
        status: 'available',
        project_id: 'none',
        tower_id: 'none',
        floor_number: '',
        unit_number: '',
        unit_config: '',
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
                base_price: property.base_price || '',
                floor_rise_price: property.floor_rise_price || '',
                plc_price: property.plc_price || '',
                bedrooms: property.bedrooms || '',
                bathrooms: property.bathrooms || '',
                area: property.size_sqft || '',
                type: property.type || 'apartment',
                status: property.status || 'available',
                project_id: property.project_id || 'none',
                tower_id: property.tower_id || 'none',
                floor_number: property.floor_number !== undefined ? property.floor_number : '',
                unit_number: property.unit_number || '',
                unit_config: property.unit_config || '',
                images: property.images || []
            })
            if (property.project_id) fetchTowers(property.project_id)
        } else {
            setFormData({
                title: '',
                description: '',
                address: '',
                price: '',
                base_price: '',
                floor_rise_price: '',
                plc_price: '',
                bedrooms: '',
                bathrooms: '',
                area: '',
                type: 'apartment',
                status: 'available',
                project_id: 'none',
                tower_id: 'none',
                floor_number: '',
                unit_number: '',
                unit_config: '',
                images: []
            })
        }
    }, [property, isOpen])

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase.from('projects').select('id, name').order('name')
            if (data) setProjects(data)
        } catch (error) { console.error(error) }
    }

    const fetchTowers = async (projectId) => {
        if (!projectId || projectId === 'none') {
            setTowers([])
            return
        }
        try {
            const { data, error } = await supabase.from('towers').select('id, name').eq('project_id', projectId).order('order_index')
            if (data) setTowers(data)
        } catch (error) { console.error(error) }
    }

    const handleProjectChange = (val) => {
        setFormData(prev => ({ ...prev, project_id: val, tower_id: 'none' }))
        fetchTowers(val)
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
            const payload = {
                ...formData,
                price: Number(formData.base_price || 0) + Number(formData.floor_rise_price || 0) + Number(formData.plc_price || 0),
                size_sqft: Number(formData.area),
                project_id: formData.project_id === 'none' ? null : formData.project_id,
                tower_id: formData.tower_id === 'none' ? null : formData.tower_id,
                floor_number: formData.floor_number === '' ? null : Number(formData.floor_number),
            }
            
            const method = isNew ? 'POST' : 'PATCH'
            const url = isNew ? '/api/inventory/properties' : `/api/inventory/properties/${property.id}`
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            
            toast.success(isNew ? 'Created' : 'Updated')
            if (onPropertyUpdated) onPropertyUpdated(data.property)
            if (onActionComplete) onActionComplete()
            onClose()
        } catch (error) {
            toast.error(error.message)
        } finally { setLoading(false) }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{property?.id ? 'Edit Property' : 'Add Property'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Project</Label>
                                    <Select value={formData.project_id} onValueChange={handleProjectChange}>
                                        <SelectTrigger><SelectValue placeholder="Project" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Project</SelectItem>
                                            {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tower / Block</Label>
                                    <Select value={formData.tower_id} onValueChange={(v) => setFormData(p => ({ ...p, tower_id: v }))}>
                                        <SelectTrigger><SelectValue placeholder="Tower" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">No Tower</SelectItem>
                                            {towers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 text-xs">
                                    <Label>Floor Number</Label>
                                    <Input type="number" value={formData.floor_number} onChange={e => setFormData(p => ({ ...p, floor_number: e.target.value }))} placeholder="e.g. 5" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit Number</Label>
                                    <Input value={formData.unit_number} onChange={e => setFormData(p => ({ ...p, unit_number: e.target.value }))} placeholder="e.g. A-502" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Property Title *</Label>
                                <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Title" required />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type *</Label>
                                    <Select value={formData.type} onValueChange={v => setFormData(p => ({ ...p, type: v }))}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {['apartment', 'villa', 'plot', 'commercial', 'penthouse', 'studio'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Config (BHK)</Label>
                                    <Input value={formData.unit_config} onChange={e => setFormData(p => ({ ...p, unit_config: e.target.value }))} placeholder="e.g. 3BHK" />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t mt-4">
                                <Label className="font-bold text-blue-600">Pricing Breakdown (₹)</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Base</Label>
                                        <Input type="number" value={formData.base_price} onChange={e => setFormData(p => ({ ...p, base_price: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">Floor Rise</Label>
                                        <Input type="number" value={formData.floor_rise_price} onChange={e => setFormData(p => ({ ...p, floor_rise_price: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase">PLC</Label>
                                        <Input type="number" value={formData.plc_price} onChange={e => setFormData(p => ({ ...p, plc_price: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3 rounded flex justify-between items-center text-sm">
                                    <span className="font-medium text-slate-500">Calculated Price:</span>
                                    <span className="font-bold text-slate-900">₹{(Number(formData.base_price) + Number(formData.floor_rise_price) + Number(formData.plc_price)).toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2"><Label>Beds</Label><Input type="number" value={formData.bedrooms} onChange={e => setFormData(p => ({ ...p, bedrooms: e.target.value }))} /></div>
                                <div className="space-y-2"><Label>Baths</Label><Input type="number" value={formData.bathrooms} onChange={e => setFormData(p => ({ ...p, bathrooms: e.target.value }))} /></div>
                                <div className="space-y-2"><Label>Area (Sqft)</Label><Input type="number" value={formData.area} onChange={e => setFormData(p => ({ ...p, area: e.target.value }))} /></div>
                            </div>
                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Textarea value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} rows={2} />
                            </div>
                            <div className="space-y-2">
                                <Label>Images</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    {formData.images.map((img, i) => (
                                        <div key={i} className="relative aspect-square rounded border overflow-hidden bg-slate-100 group">
                                            <img src={img.url} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-colors">
                                        <Upload className="w-5 h-5" />
                                        <span className="text-[10px] mt-1">Upload</span>
                                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleImageUpload} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="border-t pt-6">
                        <div className="flex justify-between items-center w-full">
                            {property?.id && (
                                <Button type="button" variant="destructive" size="sm" onClick={handleDelete} disabled={loading || uploading || deleting}>
                                    {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                                    Delete
                                </Button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <Button type="button" variant="outline" onClick={onClose} disabled={loading || deleting}>Cancel</Button>
                                <Button type="submit" disabled={loading || uploading || deleting} className="bg-blue-600 hover:bg-blue-700 min-w-[140px]">
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    {property?.id ? 'Save Changes' : 'Create Property'}
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
