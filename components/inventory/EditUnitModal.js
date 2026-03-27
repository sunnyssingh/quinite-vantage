'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'
import { Loader2, Upload, X, Image as ImageIcon, Trash2, Save, Building2, Layout, IndianRupee, Scaling, Bed } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export default function EditUnitModal({ unit, isOpen, onClose, onUnitUpdated, onActionComplete }) {
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [projects, setProjects] = useState([])
    const [towers, setTowers] = useState([])
    const [unitConfigs, setUnitConfigs] = useState([])
    
    const [formData, setFormData] = useState({
        unit_number: '',
        config_id: '',
        tower_id: 'none',
        floor_number: '',
        status: 'available',
        transaction_type: 'sell',
        base_price: '',
        floor_rise_price: '',
        plc_price: '',
        carpet_area: '',
        built_up_area: '',
        super_built_up_area: '',
        plot_area: '',
        bedrooms: '',
        bathrooms: '',
        balconies: '',
        facing: 'North',
        is_corner: false,
        is_vastu_compliant: false,
        possession_date: '',
        completion_date: '',
        construction_status: 'under_construction',
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
        if (unit) {
            setFormData({
                unit_number: unit.unit_number || '',
                config_id: unit.config_id || '',
                tower_id: unit.tower_id || 'none',
                floor_number: unit.floor_number !== undefined ? unit.floor_number : '',
                status: unit.status || 'available',
                transaction_type: unit.transaction_type || 'sell',
                base_price: unit.base_price || '',
                floor_rise_price: unit.floor_rise_price || '',
                plc_price: unit.plc_price || '',
                carpet_area: unit.carpet_area || '',
                built_up_area: unit.built_up_area || '',
                super_built_up_area: unit.super_built_up_area || '',
                plot_area: unit.plot_area || '',
                bedrooms: unit.bedrooms || '',
                bathrooms: unit.bathrooms || '',
                balconies: unit.balconies || '',
                facing: unit.facing || 'North',
                is_corner: unit.is_corner || false,
                is_vastu_compliant: unit.is_vastu_compliant || false,
                possession_date: unit.possession_date ? unit.possession_date.split('T')[0] : '',
                completion_date: unit.completion_date ? unit.completion_date.split('T')[0] : '',
                construction_status: unit.construction_status || 'under_construction',
                images: unit.images || []
            })
            if (unit.project_id) {
                fetchTowers(unit.project_id)
                fetchUnitConfigs(unit.project_id)
            }
        }
    }, [unit, isOpen])

    const fetchProjects = async () => {
        try {
            const { data } = await supabase.from('projects').select('id, name').order('name')
            if (data) setProjects(data)
        } catch (error) { console.error(error) }
    }

    const fetchTowers = async (projectId) => {
        if (!projectId || projectId === 'none') { setTowers([]); return; }
        try {
            const { data } = await supabase.from('towers').select('id, name').eq('project_id', projectId).order('order_index')
            if (data) setTowers(data)
        } catch (error) { console.error(error) }
    }

    const fetchUnitConfigs = async (projectId) => {
        if (!projectId || projectId === 'none') { setUnitConfigs([]); return; }
        try {
            const { data } = await supabase.from('unit_configs').select('*').eq('project_id', projectId).order('config_name')
            if (data) setUnitConfigs(data)
        } catch (error) { console.error(error) }
    }

    const handleProjectChange = (val) => {
        setFormData(prev => ({ ...prev, project_id: val, tower_id: 'none', config_id: '' }))
        fetchTowers(val)
        fetchUnitConfigs(val)
    }

    const handleConfigChange = (configId) => {
        const config = unitConfigs.find(c => c.id === configId)
        if (config) {
            setFormData(prev => ({
                ...prev,
                config_id: configId,
                transaction_type: config.transaction_type || prev.transaction_type,
                base_price: config.base_price || prev.base_price,
                carpet_area: config.carpet_area || prev.carpet_area,
                built_up_area: config.builtup_area || prev.built_up_area,
                super_built_up_area: config.super_builtup_area || prev.super_built_up_area,
                plot_area: config.plot_area || prev.plot_area,
                bedrooms: config.bedrooms || prev.bedrooms,
                bathrooms: config.bathrooms || prev.bathrooms,
                facing: config.facing || prev.facing
            }))
        } else {
            setFormData(prev => ({ ...prev, config_id: configId }))
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
                const { error: uploadError } = await supabase.storage.from('unit-images').upload(fileName, file)
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('unit-images').getPublicUrl(fileName)
                newImages.push({ url: publicUrl, is_featured: false })
            }
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }))
            toast.success('Images uploaded', { id: toastId })
        } catch (error) {
            toast.error('Upload failed', { id: toastId })
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const removeImage = (index) => {
        setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const isNew = !unit?.id
            const payload = {
                ...formData,
                total_price: Number(formData.base_price || 0) + Number(formData.floor_rise_price || 0) + Number(formData.plc_price || 0),
                carpet_area: formData.carpet_area ? Number(formData.carpet_area) : null,
                built_up_area: formData.built_up_area ? Number(formData.built_up_area) : null,
                super_built_up_area: formData.super_built_up_area ? Number(formData.super_built_up_area) : null,
                plot_area: formData.plot_area ? Number(formData.plot_area) : null,
                base_price: formData.base_price ? Number(formData.base_price) : null,
                floor_rise_price: formData.floor_rise_price ? Number(formData.floor_rise_price) : 0,
                plc_price: formData.plc_price ? Number(formData.plc_price) : 0,
                bedrooms: formData.bedrooms ? Number(formData.bedrooms) : null,
                bathrooms: formData.bathrooms ? Number(formData.bathrooms) : null,
                balconies: formData.balconies ? Number(formData.balconies) : 0,
                project_id: unit?.project_id || (formData.project_id === 'none' ? null : formData.project_id),
                tower_id: formData.tower_id === 'none' ? null : formData.tower_id,
                floor_number: formData.floor_number === '' ? null : Number(formData.floor_number),
            }
            
            const method = isNew ? 'POST' : 'PATCH'
            const url = isNew ? '/api/inventory/units' : `/api/inventory/units/${unit.id}`
            
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            
            toast.success(isNew ? 'Unit Created' : 'Unit Updated')
            if (onUnitUpdated) onUnitUpdated(data.unit)
            if (onActionComplete) onActionComplete()
            onClose()
        } catch (error) {
            toast.error(error.message)
        } finally { setLoading(false) }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-3xl border-0 shadow-2xl p-0 flex flex-col">
                {/* Header */}
                <div className="bg-slate-900 p-6 text-white shrink-0">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                             <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <DialogTitle className="text-xl font-black uppercase tracking-tight">{unit?.id ? 'Edit Inventory' : 'Add New Unit'}</DialogTitle>
                        </div>
                        <DialogDescription className="text-white/50 font-bold text-[10px] uppercase tracking-[0.2em] leading-none">
                            {unit?.unit_number ? `MODERATING UNIT ${unit.unit_number}` : 'INITIALIZING NEW LISTING RECORD'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Primary Identity Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Core Identity & Placement</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Project Assignment</Label>
                                <Select value={unit?.project_id || formData.project_id} onValueChange={handleProjectChange} disabled={!!unit?.id}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-bold rounded-xl focus:ring-0 focus:border-blue-400 transition-all">
                                        <SelectValue placeholder="Select Project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Project Allocated</SelectItem>
                                        {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Unit Config Profile</Label>
                                <Select value={formData.config_id} onValueChange={handleConfigChange}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-bold rounded-xl">
                                        <SelectValue placeholder="Select Configuration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unitConfigs.map(c => <SelectItem key={c.id} value={c.id}>{c.config_name} <span className="text-[9px] opacity-40">({c.bedrooms}BHK)</span></SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Identifier / Tag *</Label>
                                <Input 
                                    value={formData.unit_number} 
                                    onChange={e => setFormData(p => ({ ...p, unit_number: e.target.value }))} 
                                    className="h-12 bg-slate-50 border-slate-100 font-black text-lg tracking-tight rounded-xl placeholder:text-slate-300 focus:bg-white" 
                                    placeholder="e.g. T1-1204" 
                                    required 
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tower / Block</Label>
                                <Select value={formData.tower_id} onValueChange={(v) => setFormData(p => ({ ...p, tower_id: v }))}>
                                    <SelectTrigger className="h-12 bg-slate-50 border-slate-100 font-bold rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Standalone / No Tower</SelectItem>
                                        {towers.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Level / Floor</Label>
                                <Input type="number" value={formData.floor_number} onChange={e => setFormData(p => ({ ...p, floor_number: e.target.value }))} className="h-12 bg-slate-50 border-slate-100 font-black rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Live Status</Label>
                                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                                    <SelectTrigger className={cn(
                                        "h-12 font-black uppercase text-[10px] tracking-widest rounded-xl border-0 shadow-sm transition-all",
                                        formData.status === 'available' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-slate-900 text-white'
                                    )}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {['available', 'reserved', 'sold', 'blocked', 'under_maintenance'].map(s => <SelectItem key={s} value={s} className="font-bold uppercase text-[10px] tracking-widest">{s.replace('_', ' ')}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Financial Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Investment & Valuation</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>
                        
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2"><IndianRupee className="w-3 h-3" /> Base Valuation</Label>
                                    <Input type="number" value={formData.base_price} onChange={e => setFormData(p => ({ ...p, base_price: e.target.value }))} className="h-11 bg-white border-slate-200 font-bold rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">Floor Escalation</Label>
                                    <Input type="number" value={formData.floor_rise_price} onChange={e => setFormData(p => ({ ...p, floor_rise_price: e.target.value }))} className="h-11 bg-white border-slate-200 font-bold rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">PLC / Premium</Label>
                                    <Input type="number" value={formData.plc_price} onChange={e => setFormData(p => ({ ...p, plc_price: e.target.value }))} className="h-11 bg-white border-slate-200 font-bold rounded-xl" />
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 rounded-2xl p-6 flex justify-between items-center shadow-2xl shadow-slate-200 border border-slate-800">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Net Final Consideration</p>
                                    <p className="text-xl font-black text-white tracking-widest">₹{(Number(formData.base_price || 0) + Number(formData.floor_rise_price || 0) + Number(formData.plc_price || 0)).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <IndianRupee className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Specifications Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Technical Specifications</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1"><Bed className="w-3 h-3 text-blue-500" /> Bedrooms</Label>
                                <Input type="number" value={formData.bedrooms} onChange={e => setFormData(p => ({ ...p, bedrooms: e.target.value }))} className="h-11 bg-slate-50 border-slate-100 font-black rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">Bathrooms</Label>
                                <Input type="number" value={formData.bathrooms} onChange={e => setFormData(p => ({ ...p, bathrooms: e.target.value }))} className="h-11 bg-slate-50 border-slate-100 font-black rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1"><Scaling className="w-3 h-3 text-blue-500" /> Area (SQFT)</Label>
                                <Input type="number" value={formData.carpet_area} onChange={e => setFormData(p => ({ ...p, carpet_area: e.target.value }))} className="h-11 bg-slate-50 border-slate-100 font-black rounded-xl" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 ml-1">Facing</Label>
                                <Select value={formData.facing} onValueChange={v => setFormData(p => ({ ...p, facing: v }))}>
                                    <SelectTrigger className="h-11 bg-slate-50 border-slate-100 font-black rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {['North', 'South', 'East', 'West', 'North-East', 'South-East', 'South-West', 'North-West'].map(f => <SelectItem key={f} value={f} className="font-bold">{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Media Section */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-px bg-slate-200" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Visual Inventory</span>
                            <div className="flex-1 h-px bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                            {formData.images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl border-2 border-slate-100 overflow-hidden bg-slate-50 group shadow-sm">
                                    <img src={img.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button type="button" variant="destructive" size="icon" onClick={() => removeImage(i)} className="h-8 w-8 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => fileInputRef.current.click()} className="aspect-square border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all group">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-2 group-hover:bg-blue-100 transition-colors">
                                    <Upload className="w-5 h-5 group-hover:text-blue-600" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Add Media</span>
                                <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleImageUpload} />
                            </button>
                        </div>
                    </div>
                </form>

                <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                    <div className="flex justify-between items-center">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="font-black uppercase text-[10px] tracking-widest text-slate-400">Cancel Request</Button>
                        <Button 
                            type="button" 
                            onClick={handleSubmit} 
                            disabled={loading || uploading} 
                            className="bg-slate-950 hover:bg-black h-12 px-10 font-black uppercase text-xs tracking-[0.15em] rounded-xl shadow-2xl shadow-slate-200 flex items-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {unit?.id ? 'Execute Update' : 'Initialize Unit'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
