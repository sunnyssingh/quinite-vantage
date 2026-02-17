'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/contexts/AuthContext'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from 'react-hot-toast'
import { CopyPlus, ArrowLeft, Loader2, Save, Monitor, Smartphone, Eye, LayoutTemplate, Plus, Settings } from 'lucide-react'
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

    // Template System State
    const [showTemplateSelector, setShowTemplateSelector] = useState(false)
    const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false)
    const [newTemplateName, setNewTemplateName] = useState('')
    const [newTemplateDesc, setNewTemplateDesc] = useState('')
    const [savingTemplate, setSavingTemplate] = useState(false)

    const handleApplyTemplate = async (config) => {
        let enrichedSections = config.sections || []

        // Fetch Organization Data for pre-filling
        try {
            const { data: orgData } = await supabase
                .from('organizations')
                .select('company_name, city, sector, contact_number, address_line_1')
                .eq('id', profile.organization_id)
                .single()

            if (orgData) {
                enrichedSections = enrichedSections.map(s => {
                    const newId = `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`

                    // Enrich Hero Data
                    if (s.type === 'hero' && orgData.company_name) {
                        return {
                            ...s,
                            id: newId,
                            content: {
                                ...s.content,
                                title: orgData.company_name,
                                subtitle: s.content.subtitle || `Premier ${orgData.sector || 'Real Estate'} in ${orgData.city || 'your area'}`
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
                                heading: `About ${orgData.company_name || 'Us'}`,
                                text: `We are a leading ${orgData.sector || 'real estate'} company based in ${orgData.city || 'the region'}. ${s.content.text || ''}`
                            }
                        }
                    }

                    // Enrich Contact Data (if exists or if we add it)
                    if (s.type === 'contact') {
                        return {
                            ...s,
                            id: newId,
                            content: {
                                ...s.content,
                                address: orgData.address_line_1,
                                phone: orgData.contact_number
                            }
                        }
                    }

                    return { ...s, id: newId }
                })
            } else {
                // Fallback if fetch fails or no data
                enrichedSections = enrichedSections.map(s => ({
                    ...s,
                    id: `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
                }))
            }
        } catch (error) {
            console.error("Error fetching org data for template", error)
            // Fallback ID generation
            enrichedSections = enrichedSections.map(s => ({
                ...s,
                id: `${s.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
            }))
        }

        setSections(enrichedSections)

        if (config.settings) {
            // Merge settings to preserve existing values like logo/siteName if not provided by template
            setSettings(prev => ({ ...prev, ...config.settings }))
        }
        setShowTemplateSelector(false)
        toast.success("Template applied with your data! Don't forget to click 'Save Changes' to publish.", {
            duration: 5000,
            icon: '💾'
        })
    }

    const handleSaveTemplate = async () => {
        setSavingTemplate(true)
        try {
            const { error } = await supabase.from('website_templates').insert({
                name: newTemplateName,
                description: newTemplateDesc,
                config: { sections, settings },
                created_by: user.id
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

    // Load initial config
    useEffect(() => {
        if (authLoading) return

        if (!profile?.organization_id) {
            // Profile loaded but no org ID? Stop loading to show UI (or redirect)
            setLoading(false)
            return
        }
        loadConfig()
    }, [profile?.organization_id, authLoading])

    const loadConfig = async () => {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('website_config')
                .eq('id', profile.organization_id)
                .single()

            if (error) throw error

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
            // toast.error('Failed to load website configuration')
        } finally {
            setLoading(false)
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
                        settings, // Save settings too
                        updated_at: new Date().toISOString()
                    }
                })
                .eq('id', profile.organization_id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) throw new Error('Update failed. You might not have permission.')

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

    const handleDeleteSection = (id) => {
        setSections(sections.filter(s => s.id !== id))
    }

    const handleUpdateSection = (updatedSection) => {
        setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s))
    }

    const handleUpdateSettings = (fullConfig) => {
        // fullConfig is { sections, settings: {...} } or just updated parts?
        // SiteSettingsEditor calls onChange({ ...config, settings: ... })
        // Let's adjust SiteSettingsEditor call below to match expectations
        if (fullConfig.settings) {
            setSettings(fullConfig.settings)
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="w-8 h-8 animate-spin" /></div>
    }

    const editingSection = editingSectionId ? sections.find(s => s.id === editingSectionId) : null

    return (
        <div className="flex flex-col h-screen bg-slate-100 overflow-hidden">
            {/* Top Bar */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="mr-2">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    {/* ... Title ... */}
                    <h1 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                        Website Builder
                    </h1>
                    {/* ... Device Toggles ... */}
                    <div className="bg-slate-100 rounded-lg p-1 flex border border-slate-200">
                        {/* ... */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${viewMode === 'desktop' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                            onClick={() => setViewMode('desktop')}
                        >
                            <Monitor className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 p-0 ${viewMode === 'mobile' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
                            onClick={() => setViewMode('mobile')}
                        >
                            <Smartphone className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant={showSiteSettings ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => {
                            setShowSiteSettings(true)
                            setEditingSectionId(null) // Close section editor
                        }}
                    >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Button>
                    {/* Template Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowTemplateSelector(true)}
                    >
                        <LayoutTemplate className="w-4 h-4 mr-2" />
                        Templates
                    </Button>

                    {/* Admin: Save as Template */}
                    {['super_admin', 'platform_admin'].includes(profile?.role) && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowSaveTemplateModal(true)}
                        >
                            <CopyPlus className="w-4 h-4 mr-2" />
                            Save Tpl
                        </Button>
                    )}

                    {/* ... Preview/Save ... */}
                    <Button variant="outline" size="sm" onClick={() => window.open(`/p/${profile?.slug || 'preview'}`, '_blank')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                    </Button>
                    <Button onClick={handleSave} disabled={saving} size="sm">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar (Tools) - Left */}
                {/* ... */}
                <div className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-10 hidden md:flex">
                    {/* ... Tools List ... */}
                    <div className="p-4 border-b border-slate-100">
                        <h2 className="font-semibold text-sm text-slate-700">Add Section</h2>
                    </div>
                    <div className="p-4 space-y-2 overflow-y-auto">
                        {['Hero', 'About', 'Projects', 'Contact'].map((type) => (
                            <Button
                                key={type}
                                variant="outline"
                                className="w-full justify-start h-10 border-slate-200 hover:border-primary/50 hover:bg-slate-50"
                                onClick={() => {
                                    setSections([...sections, {
                                        id: `${type.toLowerCase()}-${Date.now()}`,
                                        type: type.toLowerCase(),
                                        content: type === 'Hero' ? { title: 'New Hero', subtitle: 'Subtitle' } : {}
                                    }])
                                }}
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {type}
                            </Button>
                        ))}
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
                                                onEdit={(s) => {
                                                    setEditingSectionId(s.id)
                                                    setShowSiteSettings(false) // Close settings
                                                }}
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
