'use client'

import { useState, useEffect, useRef } from 'react'
import { format, parseISO } from 'date-fns'
import { Calendar as CalendarIcon, Clock, User, Building2, X, Lock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { formatIndianDate } from '@/lib/formatDate'

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function taskToFormData(task) {
    const d = task?.due_date ? parseISO(task.due_date) : null
    return {
        title:       task?.title       || '',
        description: task?.description || '',
        due_date:    d ? format(d, 'yyyy-MM-dd') : '',
        due_time:    task?.due_time
                        || (d && (d.getHours() !== 0 || d.getMinutes() !== 0)
                            ? format(d, 'HH:mm')
                            : ''),
        priority:    task?.priority    || 'medium',
        assigned_to: task?.assigned_to || 'none',
        lead_id:     task?.lead_id     || null,
        project_id:  task?.project_id  || null,
    }
}

export function formDataToPayload(formData) {
    const combinedDate = formData.due_date
        ? (formData.due_time
            ? `${formData.due_date}T${formData.due_time}`
            : formData.due_date)
        : null
    return {
        title:       formData.title,
        description: formData.description || null,
        due_date:    combinedDate,
        due_time:    formData.due_time || null,
        priority:    formData.priority,
        assigned_to: formData.assigned_to === 'none' ? null : formData.assigned_to,
        lead_id:     formData.lead_id     || null,
        project_id:  formData.project_id  || null,
    }
}

export const EMPTY_FORM = {
    title: '', description: '', due_date: '', due_time: '',
    priority: 'medium', assigned_to: 'none', lead_id: null, project_id: null,
}

// ─── Lead search dropdown ─────────────────────────────────────────────────────

function LeadSelector({ value, valueLabel, onChange, disabled }) {
    const [query, setQuery]     = useState('')
    const [results, setResults] = useState([])
    const [open, setOpen]       = useState(false)
    const timer = useRef(null)

    useEffect(() => {
        if (!query.trim()) { setResults([]); return }
        clearTimeout(timer.current)
        timer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/leads?search=${encodeURIComponent(query)}&limit=8`)
                const json = await res.json()
                setResults(json.leads || json.data || [])
            } catch { setResults([]) }
        }, 300)
        return () => clearTimeout(timer.current)
    }, [query])

    if (value && valueLabel) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-50 border-blue-200">
                <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-sm font-medium text-blue-800 flex-1 truncate">{valueLabel}</span>
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => onChange(null, null)}
                        className="text-blue-400 hover:text-blue-600 shrink-0"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="relative">
            <Input
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search leads... (optional)"
                className="h-9 text-sm"
                disabled={disabled}
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.map(lead => (
                        <button
                            key={lead.id}
                            type="button"
                            onMouseDown={() => { onChange(lead.id, lead.name); setQuery(''); setOpen(false) }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <span className="font-medium">{lead.name}</span>
                            {lead.email && <span className="text-muted-foreground ml-2 text-xs">{lead.email}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Project search dropdown ──────────────────────────────────────────────────

function ProjectSelector({ value, valueLabel, onChange, disabled }) {
    const [query, setQuery]     = useState('')
    const [results, setResults] = useState([])
    const [open, setOpen]       = useState(false)
    const timer = useRef(null)

    useEffect(() => {
        if (!query.trim()) { setResults([]); return }
        clearTimeout(timer.current)
        timer.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/projects?search=${encodeURIComponent(query)}&limit=8`)
                const json = await res.json()
                setResults(json.projects || json.data || [])
            } catch { setResults([]) }
        }, 300)
        return () => clearTimeout(timer.current)
    }, [query])

    if (value && valueLabel) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-purple-50 border-purple-200">
                <Building2 className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                <span className="text-sm font-medium text-purple-800 flex-1 truncate">{valueLabel}</span>
                {!disabled && (
                    <button
                        type="button"
                        onClick={() => onChange(null, null)}
                        className="text-purple-400 hover:text-purple-600 shrink-0"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        )
    }

    return (
        <div className="relative">
            <Input
                value={query}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 150)}
                placeholder="Search projects... (optional)"
                className="h-9 text-sm"
                disabled={disabled}
            />
            {open && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.map(proj => (
                        <button
                            key={proj.id}
                            type="button"
                            onMouseDown={() => { onChange(proj.id, proj.name); setQuery(''); setOpen(false) }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                        >
                            <span className="font-medium">{proj.name}</span>
                            {(proj.city || proj.address) && <span className="text-muted-foreground ml-2 text-xs">{proj.city || proj.address}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Main Form Fields ─────────────────────────────────────────────────────────

/**
 * Props:
 *   formData        – task form state
 *   onChange        – (field, value) => void
 *   teamMembers     – [{ id, full_name, email }]
 *   canAssignOthers – boolean
 *   compact         – boolean
 *   showLeadProject – boolean (show lead/project selectors, default true)
 *   selectedLeadLabel    – string (display name for selected lead)
 *   selectedProjectLabel – string (display name for selected project)
 *   onLeadChange    – (leadId, leadName) => void
 *   onProjectChange – (projectId, projectName) => void
 *   fixedLeadId     – string (if set, lead is pre-set and not changeable)
 *   fixedLeadLabel   – string (display name for fixed lead)
 */
export default function TaskFormFields({
    formData,
    onChange,
    teamMembers = [],
    canAssignOthers = false,
    compact = false,
    showLeadProject = true,
    selectedLeadLabel = null,
    selectedProjectLabel = null,
    onLeadChange,
    onProjectChange,
    fixedLeadId = null,
    fixedLeadLabel = null,
}) {
    const sp = compact ? 'space-y-2' : 'space-y-3'
    const lc = compact ? 'text-xs text-muted-foreground' : undefined
    const ih = compact ? 'h-8 text-sm' : undefined

    const selectedDate = formData.due_date ? new Date(formData.due_date + 'T00:00:00') : undefined

    return (
        <div className={sp}>
            {/* Title */}
            <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                <Label className={lc}>
                    Title <span className="text-red-500">*</span>
                </Label>
                <Input
                    value={formData.title}
                    onChange={e => onChange('title', e.target.value)}
                    placeholder="What needs to be done?"
                    className={cn('bg-white', ih)}
                    autoFocus={!compact}
                    required
                />
            </div>

            {/* Description */}
            <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                <Label className={lc}>
                    Description{' '}
                    {!compact && <span className="text-muted-foreground text-xs font-normal">(optional)</span>}
                </Label>
                <Textarea
                    value={formData.description}
                    onChange={e => onChange('description', e.target.value)}
                    placeholder="Add details..."
                    rows={2}
                    className="resize-none text-sm bg-white"
                />
            </div>

            {/* Due Date + Time */}
            <div className="grid grid-cols-2 gap-3">
                <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                    <Label className={lc}>Due Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'w-full justify-start text-left font-normal bg-white',
                                    compact ? 'h-8 text-xs' : 'h-9 text-sm',
                                    !formData.due_date && 'text-muted-foreground'
                                )}
                            >
                                <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                                {formData.due_date
                                    ? formatIndianDate(formData.due_date + 'T00:00:00')
                                    : 'Pick a date'}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={date =>
                                    onChange('due_date', date ? format(date, 'yyyy-MM-dd') : '')
                                }
                                initialFocus
                            />
                            {formData.due_date && (
                                <div className="border-t p-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full h-7 text-xs text-muted-foreground"
                                        onClick={() => onChange('due_date', '')}
                                    >
                                        Clear date
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>
                </div>

                <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                    <Label className={lc}>Time</Label>
                    <div className="relative">
                        <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            type="time"
                            value={formData.due_time}
                            onChange={e => onChange('due_time', e.target.value)}
                            onClick={(e) => e.currentTarget.showPicker?.()}
                            className={cn(
                                'pl-9 cursor-pointer [&::-webkit-calendar-picker-indicator]:hidden bg-white',
                                compact ? 'h-8 text-xs' : 'h-9 text-sm'
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Priority + Assign To */}
            <div className={cn('grid gap-3', canAssignOthers && teamMembers.length > 0 ? 'grid-cols-2' : 'grid-cols-1')}>
                <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                    <Label className={lc}>Priority</Label>
                    <Select value={formData.priority} onValueChange={v => onChange('priority', v)}>
                        <SelectTrigger className={cn(compact ? 'h-8 text-xs' : 'h-9 text-sm', 'bg-white')}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {canAssignOthers && teamMembers.length > 0 && (
                    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                        <Label className={lc}>Assign To</Label>
                        <Select value={formData.assigned_to} onValueChange={v => onChange('assigned_to', v)}>
                            <SelectTrigger className={cn(compact ? 'h-8 text-xs' : 'h-9 text-sm', 'bg-white')}>
                                <SelectValue placeholder="Unassigned" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Unassigned</SelectItem>
                                {teamMembers.map(m => (
                                    <SelectItem key={m.id} value={m.id}>
                                        {m.full_name || m.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Lead + Project selectors (optional links) */}
            {showLeadProject && !fixedLeadId && (
                <div className="grid grid-cols-2 gap-3">
                    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                        <Label className={lc}>
                            Link to Lead{' '}
                            <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                        </Label>
                        <LeadSelector
                            value={formData.lead_id}
                            valueLabel={selectedLeadLabel}
                            onChange={(id, name) => {
                                onChange('lead_id', id)
                                onLeadChange?.(id, name)
                            }}
                        />
                    </div>

                    <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                        <Label className={lc}>
                            Link to Project{' '}
                            <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                        </Label>
                        <ProjectSelector
                            value={formData.project_id}
                            valueLabel={selectedProjectLabel}
                            onChange={(id, name) => {
                                onChange('project_id', id)
                                onProjectChange?.(id, name)
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Fixed lead display (when inside a lead profile) */}
            {fixedLeadId && fixedLeadLabel && (
                <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
                    <Label className={lc}>Linked Lead</Label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-50/60 border-blue-200">
                        <Lock className="h-3 w-3 text-blue-400 shrink-0" />
                        <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-sm font-medium text-blue-800 flex-1 truncate">{fixedLeadLabel}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
