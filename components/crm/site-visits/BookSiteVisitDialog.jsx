'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, User, MapPin, FileText, Building, Home } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { useCreateSiteVisit, useUpdateSiteVisit } from '@/hooks/useSiteVisits'
import { useProjects } from '@/hooks/useProjects'
import { useUnits } from '@/hooks/useUnits'
import { formatCurrency } from '@/lib/utils/currency'
import { toast } from 'react-hot-toast'

const EMPTY = {
    date:              '',
    time:              '10:00',
    assigned_agent_id: '',
    visit_notes:       '',
    project_id:        '',
    unit_id:           '',
}

function toFormData(visit) {
    if (!visit) return EMPTY
    const d = new Date(visit.scheduled_at)
    return {
        date:              format(d, 'yyyy-MM-dd'),
        time:              format(d, 'HH:mm'),
        assigned_agent_id: visit.assigned_agent_id ?? '',
        visit_notes:       visit.visit_notes ?? '',
        project_id:        visit.project_id ?? '',
        unit_id:           visit.unit_id ?? '',
    }
}

export default function BookSiteVisitDialog({ open, onOpenChange, leadId, lead, visit = null, agents = [], onSuccess, defaultAgentId }) {
    const isEdit = !!visit
    const [form, setForm] = useState(EMPTY)
    const [calOpen, setCalOpen] = useState(false)
    const createMutation = useCreateSiteVisit(leadId)
    const updateMutation = useUpdateSiteVisit(leadId)
    const loading = createMutation.isPending || updateMutation.isPending

    // Fetch projects
    const { data: projects = [] } = useProjects()
    
    // Fetch units if project selected
    const { data: rawUnits = [] } = useUnits(form.project_id && form.project_id !== '__none__' ? { projectId: form.project_id } : {})
    const units = rawUnits?.filter(u => u.status !== 'sold') || []

    useEffect(() => {
        if (open) {
            const base = toFormData(visit)
            if (!visit) {
                if (defaultAgentId) base.assigned_agent_id = defaultAgentId
                if (lead?.project_id) base.project_id = lead.project_id
                else if (lead?.project?.id) base.project_id = lead.project.id
            }
            setForm(base)
        }
    }, [open, visit, defaultAgentId, lead])

    const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.date || !form.time) {
            toast.error('Please pick a date and time')
            return
        }
        const scheduled_at = new Date(`${form.date}T${form.time}`).toISOString()
        const payload = {
            scheduled_at,
            assigned_agent_id: (form.assigned_agent_id && form.assigned_agent_id !== '__none__') ? form.assigned_agent_id : null,
            visit_notes:       form.visit_notes        || null,
            project_id:        (form.project_id && form.project_id !== '__none__') ? form.project_id : null,
            unit_id:           (form.unit_id && form.unit_id !== '__none__') ? form.unit_id : null,
        }
        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ visitId: visit.id, ...payload })
                toast.success('Site visit updated')
            } else {
                await createMutation.mutateAsync(payload)
                toast.success('Site visit booked')
            }
            onSuccess?.()
            onOpenChange(false)
        } catch (err) {
            toast.error(err.message || 'Something went wrong')
        }
    }

    const selectedDate = form.date ? new Date(form.date) : undefined

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        {isEdit ? 'Edit Site Visit' : 'Book Site Visit'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-1">
                    {/* Date and Time Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                            <Label>Visit Date <span className="text-red-500">*</span></Label>
                            <Popover open={calOpen} onOpenChange={setCalOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn('w-full justify-start text-left font-normal bg-white', !form.date && 'text-muted-foreground')}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">{form.date ? format(new Date(form.date), 'PPP') : 'Pick date'}</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(d) => {
                                            if (d) { set('date', format(d, 'yyyy-MM-dd')); setCalOpen(false) }
                                        }}
                                        initialFocus
                                        disabled={(d) => d < new Date(new Date().setHours(0,0,0,0))}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Time */}
                        <div className="space-y-1.5">
                            <Label htmlFor="sv-time">Visit Time <span className="text-red-500">*</span></Label>
                            <Input
                                id="sv-time"
                                type="time"
                                value={form.time}
                                onChange={e => set('time', e.target.value)}
                                className="bg-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Project & Unit Row */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Project */}
                        <div className="space-y-1.5">
                            <Label>Project</Label>
                            <Select 
                                value={form.project_id} 
                                onValueChange={v => {
                                    set('project_id', v)
                                    set('unit_id', '') // reset unit when project changes
                                }}
                            >
                                <SelectTrigger className="bg-white">
                                    <Building className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Unit (Conditionally Shown) */}
                        <div className="space-y-1.5">
                            <Label>Unit of Interest</Label>
                            <Select 
                                value={form.unit_id} 
                                onValueChange={v => set('unit_id', v)} 
                                disabled={!form.project_id || form.project_id === '__none__' || units.length === 0}
                            >
                                <SelectTrigger className="bg-white">
                                    <Home className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                    <SelectValue placeholder={
                                        (!form.project_id || form.project_id === '__none__') ? "Select project first" 
                                        : units.length > 0 ? "Select unit" : "No units available"
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">None</SelectItem>
                                    {units.map(u => {
                                        const details = [
                                            u.bedrooms ? `${u.bedrooms}BHK` : null,
                                            u.carpet_area ? `${u.carpet_area} sqft` : null,
                                            u.base_price ? formatCurrency(u.base_price) : null,
                                        ].filter(Boolean).join(' • ')
                                        
                                        return (
                                            <SelectItem key={u.id} value={u.id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Unit {u.unit_number} {u.tower?.name ? `(${u.tower.name})` : ''}</span>
                                                    {details && <span className="text-[10px] text-muted-foreground">{details}</span>}
                                                </div>
                                            </SelectItem>
                                        )
                                    })}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Agent Field (Half Width) */}
                    <div className="grid grid-cols-2 gap-4">
                        {agents.length > 0 && (
                            <div className="space-y-1.5">
                                <Label>Assigned Agent</Label>
                                <Select value={form.assigned_agent_id} onValueChange={v => set('assigned_agent_id', v)}>
                                    <SelectTrigger className="bg-white">
                                        <User className="w-4 h-4 mr-2 text-muted-foreground shrink-0" />
                                        <SelectValue placeholder="Select agent" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">Unassigned</SelectItem>
                                        {agents.map(a => (
                                            <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div></div> {/* Empty div to occupy the right half */}
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                        <Label htmlFor="sv-notes">Notes</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Textarea
                                id="sv-notes"
                                value={form.visit_notes}
                                onChange={e => set('visit_notes', e.target.value)}
                                placeholder="Any prep notes or directions..."
                                className="pl-9 resize-none bg-white"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !form.date || !form.time}>
                            {loading ? (isEdit ? 'Saving...' : 'Booking...') : (isEdit ? 'Save Changes' : 'Book Visit')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
