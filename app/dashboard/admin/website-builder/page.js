'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { CopyPlus, ArrowLeft, Loader2, Save, Monitor, Smartphone, Eye, LayoutTemplate, Plus, Settings, Building2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import TemplateSelector from '@/components/website-builder/TemplateSelector'

// Imports at top...
import SortableSection from '@/components/website-builder/SortableSection'
import SectionRenderer from '@/components/website-builder/SectionRenderer'
import SectionEditor from '@/components/website-builder/SectionEditor'
import SiteSettingsEditor from '@/components/website-builder/SiteSettingsEditor'

export default function WebsiteBuilderPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [sections, setSections] = useState([])
    const [settings, setSettings] = useState({})
    const [activeId, setActiveId] = useState(null)
    const [viewMode, setViewMode] = useState('desktop')
    const [editingSectionId, setEditingSectionId] = useState(null)
    const [showSiteSettings, setShowSiteSettings] = useState(false)
    const [orgDetails, setOrgDetails] = useState(null) // Cache for org details

    // Template System State
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState('')
    const [newTemplateDesc, setNewTemplateDesc] = useState('')
    const [savingTemplate, setSavingTemplate] = useState(false)

    // Load initial config and org details
    useEffect(() => {
        if (authLoading) return

        if (!profile?.organization_id) {
            setLoading(false)
            return
        }
        loadConfig()
    }, [profile?.organization_id, authLoading])

    const loadConfig = async () => {
        console.time('loadConfig')
        try {
            console.log('Starting loadConfig for org:', profile.organization_id)
            // Fetch both config and details in one query if possible, or parallel
            const start = performance.now()

            const fetchPromise = supabase
                .from('organizations')
                .select('website_config, company_name, city, sector, contact_number, address_line_1')
                .eq('id', profile.organization_id)
                .single()

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timed out')), 10000)
            )

            const { data, error } = await Promise.race([fetchPromise, timeoutPromise])

            const end = performance.now()
            console.log(`Supabase fetch took ${end - start}ms`)

            if (error) throw error

            // Store org details for template enrichment
            setOrgDetails({
                company_name: data.company_name,
                city: data.city,
                sector: data.sector,
                contact_number: data.contact_number,
                address_line_1: data.address_line_1
            })

            console.log('Website Config Size:', data.website_config ? JSON.stringify(data.website_config).length : 0, 'bytes')

            if (data.website_config) {
                if (Array.isArray(data.website_config.sections)) {
                    setSections(data.website_config.sections)
                }
                if (data.website_config.settings) {
                    setSettings(data.website_config.settings)
                }
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
            console.timeEnd('loadConfig')
            setLoading(false)
        }
    }

    const handleApplyTemplate = async (config) => {
        let enrichedSections = config.sections || []
        const dataToUse = orgDetails || {} // Use cached data

        try {
            if (dataToUse) {
                enrichedSections = enrichedSections.map(s => {
                    const newId = `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

                    // Enrich Hero Data
                    if (s.type === 'hero' && dataToUse.company_name) {
                        return {
                            ...s,
                            id: newId,
                            content: {
                                ...s.content,
                                title: dataToUse.company_name,
                                subtitle: s.content.subtitle || `Premier ${dataToUse.sector || 'Real Estate'} in ${dataToUse.city || 'your area'}`
                            }
                        }
                    }

                    // Enrich About Data
                    if (s.type === 'about') {
                        return {
                            ...s,
                            id: newId,
                            content: {
                                ...s.content,
                                heading: `About ${dataToUse.company_name || 'Us'}`,
                                text: `We are a leading ${dataToUse.sector || 'real estate'} company based in ${dataToUse.city || 'the region'}. ${s.content.text || ''}`
                            }
                        }
                    }

                    // Enrich Contact Data
                    if (s.type === 'contact') {
                        return {
                            ...s,
                            id: newId,
                            content: {
                                ...s.content,
                                address: dataToUse.address_line_1,
                                phone: dataToUse.contact_number
                            }
                        }
                    }

                    return { ...s, id: newId }
                })
            } else {
                // Fallback
                enrichedSections = enrichedSections.map(s => ({
                    ...s,
                    id: `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                }))
            }

            // Apply new sections
            setSections(enrichedSections)

            if (config.settings) {
                setSettings(prev => ({ ...prev, ...config.settings }))
            }

            setShowTemplateSelector(false)
            toast.success("Template applied successfully!", {
                icon: '✨'
            })

        } catch (error) {
            console.error("Error applying template", error)
            toast.error("Issue applying template")
        }
    }

    const handleSaveTemplate = async () => {
        setSavingTemplate(true)
        try {
            const { error } = await supabase.from('website_templates').insert({
                name: newTemplateName,
                description: newTemplateDesc,
                config: { sections, settings },
                created_by: user.id,
                is_active: true // Auto-activate for now
            })
            if (error) throw error
            toast.success('Template created successfully!')
            setShowSaveTemplateModal(false)
            setNewTemplateName('')
            setNewTemplateDesc('')
        } catch (err) {
            console.error('Failed to save template', err)
            toast.error('Failed to save template')
        } finally {
            setSavingTemplate(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data, error } = await supabase
                .from('organizations')
                .update({
                    website_config: {
                        sections,
                        settings,
                        updated_at: new Date().toISOString()
                    }
                })
                .eq('id', profile.organization_id)
                .select()

            if (error) throw error

            toast.success('Website saved successfully')
        } catch (err) {
            console.error('Error saving:', err)
            toast.error(err.message || 'Failed to save changes')
        } finally {
            setSaving(false)
        }
    }

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragStart = (event) => {
        setActiveId(event.active.id)
    }

    const handleDragEnd = (event) => {
        const { active, over } = event

        if (active.id !== over?.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)
                return arrayMove(items, oldIndex, newIndex)
            })
        }
        setActiveId(null)
    }

    const handleDeleteSection = useCallback((id) => {
        setSections(prev => prev.filter(s => s.id !== id))
    }, [])

    const handleUpdateSection = useCallback((updatedSection) => {
        setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s))
    }, [])

    const handleEditSection = useCallback((id) => {
        setEditingSectionId(id)
        setShowSiteSettings(false)
    }, [])

    const handleUpdateSettings = useCallback((fullConfig) => {
        if (fullConfig.settings) {
            setSettings(fullConfig.settings)
        }
    }, [])

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    const editingSection = editingSectionId ? sections.find(s => s.id === editingSectionId) : null

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 z-20 sticky top-0">
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="text-slate-500 hover:text-slate-900 hover:bg-slate-100/50 rounded-full">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                            <LayoutTemplate className="w-5 h-5" />
                        </div>
                        <h1 className="font-bold text-lg text-slate-900 tracking-tight">
                            Website Builder
                        </h1>
                    </div>

                    <div className="h-6 w-px bg-slate-200 mx-2" />

                    {/* Device Toggles */}
                    <div className="bg-slate-100/80 p-1 rounded-full flex gap-1 border border-slate-200/50">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 rounded-full transition-all duration-300 ${viewMode === 'desktop' ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setViewMode('desktop')}
                        >
                            <Monitor className="w-4 h-4 mr-2" />
                            <span className="text-xs">Desktop</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-3 rounded-full transition-all duration-300 ${viewMode === 'mobile' ? 'bg-white shadow-sm text-primary font-medium' : 'text-slate-500 hover:text-slate-700'}`}
                            onClick={() => setViewMode('mobile')}
                        >
                            <Smartphone className="w-4 h-4 mr-2" />
                            <span className="text-xs">Mobile</span>
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/50 mr-2">
                        <Button
                            variant={showSiteSettings ? "secondary" : "ghost"}
                            size="sm"
                            className={`h-8 text-xs font-medium ${showSiteSettings ? 'bg-white shadow-sm' : 'text-slate-600'}`}
                            onClick={() => {
                                setShowSiteSettings(true)
                                setEditingSectionId(null)
                            }}
                        >
                            <Settings className="w-3.5 h-3.5 mr-2" />
                            Settings
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs font-medium text-slate-600 hover:text-primary hover:bg-white/50"
                            onClick={() => setShowTemplateSelector(true)}
                        >
                            <LayoutTemplate className="w-3.5 h-3.5 mr-2" />
                            Templates
                        </Button>
                    </div>

                    {['super_admin', 'platform_admin'].includes(profile?.role) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSaveTemplateModal(true)}
                            className="text-slate-500 hover:text-primary"
                        >
                            <CopyPlus className="w-4 h-4" />
                        </Button>
                    )}

                    <div className="h-6 w-px bg-slate-200" />

                    <Button variant="outline" size="sm" onClick={() => {
                        const baseUrl = profile?.slug ? `/p/${profile.slug}` : `/p/preview?id=${profile?.organization_id}`;
                        const freshUrl = `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
                        window.open(freshUrl, '_blank');
                    }} className="rounded-full px-4 border-slate-200 hover:bg-slate-50 text-slate-600">
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </Button>

                    <Button onClick={handleSave} disabled={saving} size="sm" className="rounded-full px-5 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        {saving ? 'Saving...' : 'Publish'}
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden relative">
                {/* Sidebar (Tools) - Left */}
                <div className="w-72 bg-white/80 backdrop-blur-sm border-r border-slate-200 flex flex-col shrink-0 z-10 hidden md:flex transition-all duration-300">
                    <div className="p-5 border-b border-slate-100">
                        <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <Plus className="w-4 h-4 text-primary" />
                            Add Section
                        </h2>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                        {['Hero', 'About', 'Projects', 'Contact'].map((type) => (
                            <div key={type} className="group relative">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start h-14 border-slate-200 hover:border-primary/30 hover:bg-slate-50/80 transition-all rounded-xl relative overflow-hidden"
                                    onClick={() => {
                                        setSections([...sections, {
                                            id: `${type.toLowerCase()}-${Date.now()}`,
                                            type: type.toLowerCase(),
                                            content: type === 'Hero' ? { title: 'New Hero', subtitle: 'Subtitle' } : {}
                                        }])
                                        toast.success(`Added ${type} section`)
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center mr-3 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                        {type === 'Hero' && <LayoutTemplate className="w-4 h-4" />}
                                        {type === 'About' && <div className="text-xs font-bold">Ab</div>}
                                        {type === 'Projects' && <Building2 className="w-4 h-4" />}
                                        {type === 'Contact' && <Smartphone className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className="font-semibold text-slate-700 group-hover:text-slate-900">{type}</span>
                                        <span className="text-[10px] text-slate-400 font-normal">Drag to reorder</span>
                                    </div>
                                    <Plus className="w-4 h-4 absolute right-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-auto p-4 border-t border-slate-100">
                        <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 border border-slate-100">
                            <p className="font-medium text-slate-700 mb-1">Pro Tip</p>
                            You can reorder sections by dragging them in the canvas.
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 bg-slate-100 overflow-y-auto p-4 md:p-8 flex justify-center relative">
                    <div
                        className={`bg-white shadow-xl transition-all duration-300 ease-in-out min-h-[500px] ${viewMode === 'mobile' ? 'w-[375px]' : 'w-full max-w-5xl'
                            }`}
                        style={{ border: viewMode === 'mobile' ? '8px solid #333' : 'none', borderRadius: viewMode === 'mobile' ? '24px' : '0' }}
                    >
                        {viewMode === 'mobile' && <div className="h-6 w-32 bg-black mx-auto rounded-b-xl mb-4" />} {/* Notch Simulation */}

                        <div className="p-4 min-h-full">
                            {/* Render Nav using Settings */}
                            {settings.logoUrl || settings.siteName ? (
                                <div className="mb-4 p-4 border-b border-gray-100 flex justify-between items-center bg-white" style={{ borderColor: settings.primaryColor ? `${settings.primaryColor}20` : '' }}>
                                    <div className="flex items-center gap-3">
                                        {settings.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-8" />}
                                        {settings.siteName && <span className="font-bold text-lg" style={{ color: settings.primaryColor }}>{settings.siteName}</span>}
                                    </div>
                                    <nav className="hidden md:flex gap-4 text-sm font-medium text-gray-600">
                                        <a href="#">Home</a>
                                        <a href="#">Projects</a>
                                        <a href="#">About</a>
                                        <a href="#">Contact</a>
                                    </nav>
                                </div>
                            ) : null}

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={sections.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-4">
                                        {sections.map((section) => (
                                            <SortableSection
                                                key={section.id}
                                                id={section.id}
                                                section={section}
                                                onEdit={handleEditSection}
                                                onDelete={handleDeleteSection}
                                            >
                                                <SectionRenderer type={section.type} content={section.content} />
                                            </SortableSection>
                                        ))}
                                    </div>
                                </SortableContext>
                                <DragOverlay>
                                    {activeId ? (
                                        <div className="opacity-80">
                                            {(() => {
                                                const s = sections.find(x => x.id === activeId)
                                                return s ? (
                                                    <SortableSection id={s.id} section={s} onEdit={() => { }} onDelete={() => { }}>
                                                        <SectionRenderer type={s.type} content={s.content} />
                                                    </SortableSection>
                                                ) : null
                                            })()}
                                        </div>
                                    ) : null}
                                </DragOverlay>
                            </DndContext>

                            {sections.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                                    <Plus className="w-10 h-10 mb-2 opacity-50" />
                                    <p>Drag or click sections to add them here</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Properties Panel (Right) - Section Editor */}
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

            {/* Modals */}
            <TemplateSelector
                isOpen={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelect={handleApplyTemplate}
            />

            {/* Save Template Modal */}
            <Dialog open={showSaveTemplateModal} onOpenChange={setShowSaveTemplateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save as Template</DialogTitle>
                        <DialogDescription>Create a reusable template from your current design.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Template Name</label>
                            <Input
                                placeholder="e.g. Modern Dark Theme"
                                value={newTemplateName}
                                onChange={e => setNewTemplateName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description</label>
                            <Textarea
                                placeholder="Brief description of this style..."
                                value={newTemplateDesc}
                                onChange={e => setNewTemplateDesc(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSaveTemplateModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveTemplate} disabled={savingTemplate || !newTemplateName}>
                            {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Create Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
