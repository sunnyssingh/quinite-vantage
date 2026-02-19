'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import {
    CopyPlus, ArrowLeft, Loader2, Monitor, Smartphone, Eye,
    LayoutTemplate, Plus, Settings, Building2, ChevronDown,
    Tablet, Layers, PanelLeft, Undo2, Redo2, CheckCircle2,
    FileText, Phone, User, Sparkles, Grid3X3, Globe,
    EyeOff, Trash2, GripVertical, ZoomIn, ZoomOut
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import TemplateSelector from '@/components/website-builder/TemplateSelector'
import SortableSection from '@/components/website-builder/SortableSection'
import SectionRenderer from '@/components/website-builder/SectionRenderer'
import SectionEditor from '@/components/website-builder/SectionEditor'
import SiteSettingsEditor from '@/components/website-builder/SiteSettingsEditor'
import { cn } from '@/lib/utils'

const SECTION_TYPES = [
    {
        group: 'Hero',
        items: [
            { type: 'hero', label: 'Hero', description: 'Full-width opening banner', icon: Sparkles, color: 'from-violet-500 to-purple-600' },
        ]
    },
    {
        group: 'Content',
        items: [
            { type: 'about', label: 'About', description: 'Company or team overview', icon: User, color: 'from-blue-500 to-cyan-500' },
            { type: 'projects', label: 'Projects', description: 'Showcase portfolio grid', icon: Building2, color: 'from-emerald-500 to-teal-500' },
        ]
    },
    {
        group: 'Contact',
        items: [
            { type: 'contact', label: 'Contact', description: 'Get in touch form & details', icon: Phone, color: 'from-rose-500 to-pink-500' },
        ]
    },
]

const ZOOM_LEVELS = [50, 75, 100, 125, 150]

export default function WebsiteBuilderPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState(null)
    const [sections, setSections] = useState([])
    const [settings, setSettings] = useState({})
    const [activeId, setActiveId] = useState(null)
    const [viewMode, setViewMode] = useState('desktop')
    const [zoom, setZoom] = useState(100)
    const [editingSectionId, setEditingSectionId] = useState(null)
    const [showSiteSettings, setShowSiteSettings] = useState(false)
    const [orgDetails, setOrgDetails] = useState(null)
    const [leftTab, setLeftTab] = useState('sections') // 'sections' | 'layers'
    const [hiddenSections, setHiddenSections] = useState(new Set())

    // Template System State
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState('')
    const [newTemplateDesc, setNewTemplateDesc] = useState('')
    const [savingTemplate, setSavingTemplate] = useState(false)

    useEffect(() => {
        // Wait for auth to finish — runs on first mount AND whenever auth state changes
        if (authLoading) return
        if (!profile?.organization_id) {
            setLoading(false)
            return
        }
        loadConfig()
    }, [authLoading, profile?.organization_id]) // authLoading first so it triggers immediately when it flips to false

    const loadConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('website_config, company_name, slug, city, sector, contact_number, address_line_1')
                .eq('id', profile.organization_id)
                .single()

            if (error) throw error

            setOrgDetails({
                company_name: data.company_name,
                slug: data.slug,
                city: data.city,
                sector: data.sector,
                contact_number: data.contact_number,
                address_line_1: data.address_line_1
            })

            if (data.website_config) {
                if (Array.isArray(data.website_config.sections)) setSections(data.website_config.sections)
                if (data.website_config.settings) setSettings(data.website_config.settings)
            } else {
                setSections([
                    { id: 'hero-1', type: 'hero', content: { title: 'Welcome', subtitle: 'Building the Future' } },
                    { id: 'projects-1', type: 'projects', content: { title: 'Our Projects' } }
                ])
            }
        } catch (err) {
            console.error('Error loading config:', err)
            toast.error('Failed to load website configuration')
        } finally {
            setLoading(false)
        }
    }

    const handleApplyTemplate = async (config) => {
        let enrichedSections = config.sections || []
        const d = orgDetails || {}
        try {
            enrichedSections = enrichedSections.map(s => {
                const newId = `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                if (s.type === 'hero' && d.company_name) return { ...s, id: newId, content: { ...s.content, title: d.company_name, subtitle: s.content.subtitle || `Premier ${d.sector || 'Real Estate'} in ${d.city || 'your area'}` } }
                if (s.type === 'about') return { ...s, id: newId, content: { ...s.content, heading: `About ${d.company_name || 'Us'}`, text: `We are a leading ${d.sector || 'real estate'} company based in ${d.city || 'the region'}. ${s.content.text || ''}` } }
                if (s.type === 'contact') return { ...s, id: newId, content: { ...s.content, address: d.address_line_1, phone: d.contact_number } }
                return { ...s, id: newId }
            })
            setSections(enrichedSections)
            if (config.settings) setSettings(prev => ({ ...prev, ...config.settings }))
            setShowTemplateSelector(false)
            toast.success('Template applied!', { icon: '✨' })
        } catch (error) {
            toast.error('Issue applying template')
        }
    }

    const handleSaveTemplate = async () => {
        setSavingTemplate(true)
        try {
            const { error } = await supabase.from('website_templates').insert({
                name: newTemplateName, description: newTemplateDesc,
                config: { sections, settings }, created_by: user.id, is_active: true
            })
            if (error) throw error
            toast.success('Template created!')
            setShowSaveTemplateModal(false)
            setNewTemplateName(''); setNewTemplateDesc('')
        } catch (err) {
            toast.error('Failed to save template')
        } finally {
            setSavingTemplate(false)
        }
    }

    const handleSave = async () => {
        if (!profile?.organization_id) {
            toast.error('Organization not loaded yet. Please wait.')
            return
        }
        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('organizations')
                .update({ website_config: { sections, settings, updated_at: new Date().toISOString() } })
                .eq('id', profile.organization_id)
                .select('id')
            if (error) throw error
            if (!data || data.length === 0) throw new Error('Permission denied — only admins can publish the website.')
            setLastSaved(new Date())
            toast.success('Published successfully!', { icon: '🚀' })
        } catch (err) {
            toast.error(err.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event) => {
        const { active, over } = event
        if (active.id !== over?.id) {
            setSections(items => {
                const oldIndex = items.findIndex(i => i.id === active.id)
                const newIndex = items.findIndex(i => i.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
        setActiveId(null)
    }

    const handleDeleteSection = useCallback((id) => {
        setSections(prev => prev.filter(s => s.id !== id))
        if (editingSectionId === id) setEditingSectionId(null)
    }, [editingSectionId])

    const handleUpdateSection = useCallback((updatedSection) => {
        setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s))
    }, [])

    const handleEditSection = useCallback((id) => {
        setEditingSectionId(id)
        setShowSiteSettings(false)
    }, [])

    const handleUpdateSettings = useCallback((fullConfig) => {
        if (fullConfig.settings) setSettings(fullConfig.settings)
    }, [])

    const handleDuplicateSection = useCallback((id) => {
        setSections(prev => {
            const idx = prev.findIndex(s => s.id === id)
            if (idx === -1) return prev
            const original = prev[idx]
            const copy = { ...original, id: `${original.type}-${Date.now()}` }
            const next = [...prev]
            next.splice(idx + 1, 0, copy)
            return next
        })
        toast.success('Section duplicated')
    }, [])

    const toggleSectionVisibility = (id) => {
        setHiddenSections(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const addSection = (type) => {
        const newSec = {
            id: `${type}-${Date.now()}`,
            type,
            content: type === 'hero' ? { title: orgDetails?.company_name || 'Your Company', subtitle: 'Subtitle here' } : {}
        }
        setSections(prev => [...prev, newSec])
        setLeftTab('layers')
        toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} section added`)
    }

    const canvasWidth = viewMode === 'mobile' ? 390 : viewMode === 'tablet' ? 768 : '100%'

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Loading workspace…</p>
                </div>
            </div>
        )
    }

    const editingSection = editingSectionId ? sections.find(s => s.id === editingSectionId) : null

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-50" style={{ fontFamily: '"Inter", system-ui, sans-serif' }}>

            {/* ── TOP TOOLBAR ─────────────────────────────────────────── */}
            <header className="h-12 shrink-0 flex items-center justify-between px-3 border-b bg-white border-slate-200 shadow-sm">

                {/* Left: Back + Branding */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => window.history.back()}
                        className="flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="h-4 w-px bg-slate-200" />
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center">
                            <Globe className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800">Website Builder</span>
                        {settings?.siteName && (
                            <span className="text-xs text-slate-400 hidden md:block">/ {settings.siteName}</span>
                        )}
                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Undo / Redo placeholder */}
                    <div className="flex items-center gap-0.5">
                        <button disabled className="flex items-center justify-center w-7 h-7 rounded-md text-slate-300 cursor-not-allowed">
                            <Undo2 className="w-3.5 h-3.5" />
                        </button>
                        <button disabled className="flex items-center justify-center w-7 h-7 rounded-md text-slate-300 cursor-not-allowed">
                            <Redo2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Center: Device Toggle */}
                <div className="flex items-center gap-1 px-1 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                    {[
                        { mode: 'desktop', Icon: Monitor, label: 'Desktop' },
                        { mode: 'tablet', Icon: Tablet, label: 'Tablet' },
                        { mode: 'mobile', Icon: Smartphone, label: 'Mobile' },
                    ].map(({ mode, Icon, label }) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode)}
                            title={label}
                            className={cn(
                                'flex items-center justify-center w-8 h-7 rounded-md transition-all duration-150',
                                viewMode === mode
                                    ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                                    : 'text-slate-400 hover:text-slate-600'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {/* Zoom */}
                    <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
                        <button onClick={() => setZoom(z => Math.max(50, z - 25))} className="w-6 h-6 flex items-center justify-center rounded hover:text-slate-800 hover:bg-slate-100">
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center tabular-nums">{zoom}%</span>
                        <button onClick={() => setZoom(z => Math.min(150, z + 25))} className="w-6 h-6 flex items-center justify-center rounded hover:text-slate-800 hover:bg-slate-100">
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-slate-200" />

                    {/* Settings */}
                    <button
                        onClick={() => { setShowSiteSettings(true); setEditingSectionId(null) }}
                        className={cn('flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium transition-colors', showSiteSettings ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Settings</span>
                    </button>

                    {/* Templates */}
                    <button
                        onClick={() => setShowTemplateSelector(true)}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                    >
                        <LayoutTemplate className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Templates</span>
                    </button>

                    {/* Save as Template (super admin only) */}
                    {['super_admin', 'platform_admin'].includes(profile?.role) && (
                        <button
                            onClick={() => setShowSaveTemplateModal(true)}
                            className="flex items-center justify-center w-7 h-7 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Save as Template"
                        >
                            <CopyPlus className="w-3.5 h-3.5" />
                        </button>
                    )}

                    <div className="h-4 w-px bg-slate-200" />

                    {/* Preview */}
                    <button
                        onClick={() => {
                            const slug = orgDetails?.slug || null
                            const orgId = profile?.organization_id
                            const bust = `t=${Date.now()}`
                            const url = slug
                                ? `/p/${slug}?${bust}`
                                : `/p/preview?id=${orgId}&${bust}`
                            window.open(url, '_blank')
                        }}
                        className="flex items-center gap-1.5 h-7 px-3 rounded-md text-xs font-medium border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                    </button>

                    {/* Publish */}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 h-7 px-4 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 shadow-sm"
                    >
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {saving ? 'Saving…' : 'Publish'}
                    </button>
                </div>
            </header>

            {/* ── MAIN WORKSPACE ──────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── LEFT PANEL ── */}
                <aside className="w-60 shrink-0 flex flex-col border-r bg-white border-slate-200">

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200">
                        {[
                            { id: 'sections', label: 'Add', Icon: Plus },
                            { id: 'layers', label: 'Layers', Icon: Layers },
                        ].map(({ id, label, Icon }) => (
                            <button
                                key={id}
                                onClick={() => setLeftTab(id)}
                                className={cn(
                                    'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2',
                                    leftTab === id
                                        ? 'text-blue-600 border-blue-500 bg-blue-50/50'
                                        : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Sections Tab */}
                    {leftTab === 'sections' && (
                        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                            {SECTION_TYPES.map(group => (
                                <div key={group.group}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 px-1">
                                        {group.group}
                                    </p>
                                    <div className="space-y-1.5">
                                        {group.items.map(({ type, label, description, icon: Icon, color }) => (
                                            <button
                                                key={type}
                                                onClick={() => addSection(type)}
                                                className="w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all hover:bg-slate-50 group border border-transparent hover:border-slate-200"
                                            >
                                                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', color)}>
                                                    <Icon className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">{label}</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{description}</p>
                                                </div>
                                                <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 shrink-0 ml-auto transition-colors" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-4 p-3 rounded-xl text-xs bg-blue-50 border border-blue-100">
                                <p className="font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                                    <Grid3X3 className="w-3.5 h-3.5" /> Tip
                                </p>
                                <p className="text-blue-500 leading-relaxed">Drag sections to reorder them in the Layers panel.</p>
                            </div>
                        </div>
                    )}

                    {/* Layers Tab */}
                    {leftTab === 'layers' && (
                        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
                            {sections.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center">
                                    <Layers className="w-8 h-8 text-slate-300 mb-2" />
                                    <p className="text-xs text-slate-400">No sections yet.<br />Add sections from the Add tab.</p>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {sections.map((section, idx) => {
                                        const isHidden = hiddenSections.has(section.id)
                                        const isEditing = editingSectionId === section.id
                                        const Icon = SECTION_TYPES.flatMap(g => g.items).find(i => i.type === section.type)?.icon || FileText
                                        return (
                                            <div
                                                key={section.id}
                                                onClick={() => handleEditSection(section.id)}
                                                className={cn(
                                                    'flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer transition-all group',
                                                    isEditing
                                                        ? 'bg-blue-50 border border-blue-200'
                                                        : 'hover:bg-slate-50 border border-transparent'
                                                )}
                                            >
                                                <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                                <Icon className={cn('w-3.5 h-3.5 shrink-0', isEditing ? 'text-blue-500' : 'text-slate-400')} />
                                                <span className={cn('flex-1 text-xs font-medium capitalize truncate', isEditing ? 'text-blue-600' : 'text-slate-700')}>
                                                    {section.type}
                                                </span>
                                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); toggleSectionVisibility(section.id) }}
                                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200"
                                                        title={isHidden ? 'Show' : 'Hide'}
                                                    >
                                                        {isHidden
                                                            ? <EyeOff className="w-3 h-3 text-slate-400" />
                                                            : <Eye className="w-3 h-3 text-slate-400" />
                                                        }
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleDeleteSection(section.id) }}
                                                        className="w-5 h-5 flex items-center justify-center rounded hover:bg-red-50"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-3 h-3 text-slate-400 hover:text-red-500" />
                                                    </button>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </aside>

                {/* ── CANVAS AREA ── */}
                <div
                    className="flex-1 overflow-auto relative flex flex-col items-center"
                    style={{
                        background: '#f1f5f9',
                        backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                    }}
                >
                    {/* Canvas wrapper */}
                    <div
                        className="my-8 origin-top transition-all duration-300"
                        style={{
                            transform: `scale(${zoom / 100})`,
                            transformOrigin: 'top center',
                            width: viewMode === 'mobile' ? '390px' : viewMode === 'tablet' ? '768px' : 'min(calc(100vw - 520px), 1200px)',
                        }}
                    >
                        {/* Device frame */}
                        <div
                            className="relative bg-white min-h-[600px] overflow-hidden"
                            style={{
                                borderRadius: viewMode !== 'desktop' ? '24px' : '8px',
                                border: viewMode !== 'desktop' ? '10px solid #334155' : '1px solid #e2e8f0',
                                boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)',
                            }}
                        >
                            {/* Mobile notch */}
                            {viewMode === 'mobile' && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-800 rounded-b-2xl z-50" />
                            )}

                            {/* Site nav preview */}
                            {(settings?.siteName || settings?.logoUrl) && (
                                <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100"
                                    style={{ backgroundColor: settings?.navBg || '#fff' }}>
                                    <div className="flex items-center gap-3">
                                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-7" />}
                                        {settings.siteName && (
                                            <span className="font-bold text-base" style={{ color: settings.primaryColor || '#111' }}>
                                                {settings.siteName}
                                            </span>
                                        )}
                                    </div>
                                    <nav className="hidden md:flex gap-5 text-sm font-medium text-gray-600">
                                        <a href="#">Home</a><a href="#">Projects</a><a href="#">About</a><a href="#">Contact</a>
                                    </nav>
                                </div>
                            )}

                            {/* Sections */}
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
                                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    <div className="divide-y divide-gray-100">
                                        {sections.map(section => (
                                            !hiddenSections.has(section.id) && (
                                                <SortableSection
                                                    key={section.id}
                                                    id={section.id}
                                                    section={section}
                                                    isEditing={editingSectionId === section.id}
                                                    onEdit={handleEditSection}
                                                    onDelete={handleDeleteSection}
                                                    onDuplicate={handleDuplicateSection}
                                                >
                                                    <SectionRenderer type={section.type} content={section.content} />
                                                </SortableSection>
                                            )
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeId && (() => {
                                        const s = sections.find(x => x.id === activeId)
                                        return s ? (
                                            <div className="opacity-90 bg-white ring-2 ring-blue-500 shadow-2xl rounded-lg">
                                                <SectionRenderer type={s.type} content={s.content} />
                                            </div>
                                        ) : null
                                    })()}
                                </DragOverlay>
                            </DndContext>

                            {sections.filter(s => !hiddenSections.has(s.id)).length === 0 && (
                                <div className="flex flex-col items-center justify-center py-32 text-center px-8">
                                    <div className="w-16 h-16 rounded-2xl bg-zinc-100 flex items-center justify-center mb-4">
                                        <Plus className="w-7 h-7 text-zinc-400" />
                                    </div>
                                    <p className="font-semibold text-zinc-800 mb-1">Start building your site</p>
                                    <p className="text-sm text-zinc-400">Add sections from the panel on the left</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── RIGHT PANEL: Section Editor or Site Settings ── */}
                {editingSection && (
                    <SectionEditor
                        section={editingSection}
                        onChange={handleUpdateSection}
                        onClose={() => setEditingSectionId(null)}
                    />
                )}
                {showSiteSettings && (
                    <SiteSettingsEditor
                        config={{ settings }}
                        onChange={handleUpdateSettings}
                        onClose={() => setShowSiteSettings(false)}
                    />
                )}
            </div>

            {/* ── STATUS BAR ─────────────────────────────────────────── */}
            <footer className="h-7 shrink-0 flex items-center justify-between px-4 border-t text-[11px] bg-white border-slate-200 text-slate-400">
                <div className="flex items-center gap-3">
                    <span>{sections.length} section{sections.length !== 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} view</span>
                </div>
                <div className="flex items-center gap-3">
                    {lastSaved && (
                        <span className="text-emerald-600">
                            Saved {lastSaved.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                    <span>Zoom {zoom}%</span>
                </div>
            </footer>

            {/* ── MODALS ─────────────────────────────────────────────── */}
            <TemplateSelector
                isOpen={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelect={handleApplyTemplate}
            />

            <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save as Template</DialogTitle>
                        <DialogDescription>Create a reusable template from your current design.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Template Name</label>
                            <Input placeholder="e.g. Modern Light Theme" value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Description</label>
                            <Textarea placeholder="Brief description…" value={newTemplateDesc} onChange={e => setNewTemplateDesc(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate} disabled={savingTemplate || !newTemplateName} className="bg-blue-600 hover:bg-blue-700">
                            {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Create Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
