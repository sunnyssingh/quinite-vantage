'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
    X, Type, Image as ImageIcon, Palette,
    Sparkles, User, Building2, Phone, FileText,
    AlignLeft, AlignCenter, AlignRight, Sliders,
    Monitor, Smartphone, Link
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
    { id: 'content', label: 'Content', Icon: Type },
    { id: 'style', label: 'Style', Icon: Palette },
    { id: 'advanced', label: 'Advanced', Icon: Sliders },
]

const SECTION_ICONS = {
    hero: Sparkles,
    about: User,
    projects: Building2,
    contact: Phone,
}

const SECTION_COLORS = {
    hero: 'from-violet-500 to-purple-600',
    about: 'from-blue-500 to-cyan-500',
    projects: 'from-emerald-500 to-teal-500',
    contact: 'from-rose-500 to-pink-500',
}

function FieldGroup({ label, children }) {
    return (
        <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
            <div className="space-y-3">{children}</div>
        </div>
    )
}

function Field({ label, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">{label}</Label>
            {children}
        </div>
    )
}

const inputCls = "h-8 text-sm bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-blue-400 focus:ring-0 focus:ring-offset-0"
const textareaCls = "text-sm bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-blue-400 min-h-[72px] resize-none"

function ContentForm({ section, handleChange }) {
    const { type, content } = section

    if (type === 'hero') return (
        <div className="space-y-5">
            <FieldGroup label="Text">
                <Field label="Headline">
                    <Input value={content.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Main headline…" className={inputCls} />
                </Field>
                <Field label="Subtitle">
                    <Textarea value={content.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)} placeholder="Supporting subtitle…" className={textareaCls} />
                </Field>
            </FieldGroup>
            <FieldGroup label="Call-to-Action">
                <Field label="Button Label">
                    <Input value={content.ctaText || ''} onChange={e => handleChange('ctaText', e.target.value)} placeholder="e.g. View Projects" className={inputCls} />
                </Field>
                <Field label="Button URL">
                    <div className="relative">
                        <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <Input value={content.ctaUrl || ''} onChange={e => handleChange('ctaUrl', e.target.value)} placeholder="/projects" className={cn(inputCls, 'pl-7')} />
                    </div>
                </Field>
            </FieldGroup>
            <FieldGroup label="Media">
                <Field label="Background Image URL">
                    <div className="relative">
                        <ImageIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                        <Input value={content.bgImage || ''} onChange={e => handleChange('bgImage', e.target.value)} placeholder="https://…" className={cn(inputCls, 'pl-7')} />
                    </div>
                </Field>
            </FieldGroup>
        </div>
    )

    if (type === 'about') return (
        <div className="space-y-5">
            <FieldGroup label="Text">
                <Field label="Heading">
                    <Input value={content.heading || ''} onChange={e => handleChange('heading', e.target.value)} placeholder="About Us" className={inputCls} />
                </Field>
                <Field label="Body Text">
                    <Textarea value={content.text || ''} onChange={e => handleChange('text', e.target.value)} placeholder="Tell your story…" className={cn(textareaCls, 'min-h-[96px]')} />
                </Field>
            </FieldGroup>
            <FieldGroup label="Highlights">
                <Field label="Highlight 1">
                    <Input value={content.highlight1 || ''} onChange={e => handleChange('highlight1', e.target.value)} placeholder="e.g. 10+ Years" className={inputCls} />
                </Field>
                <Field label="Highlight 2">
                    <Input value={content.highlight2 || ''} onChange={e => handleChange('highlight2', e.target.value)} placeholder="e.g. 500 Projects" className={inputCls} />
                </Field>
            </FieldGroup>
        </div>
    )

    if (type === 'projects') return (
        <div className="space-y-5">
            <FieldGroup label="Section Header">
                <Field label="Heading">
                    <Input value={content.title || ''} onChange={e => handleChange('title', e.target.value)} placeholder="Our Projects" className={inputCls} />
                </Field>
                <Field label="Subheading">
                    <Input value={content.subtitle || ''} onChange={e => handleChange('subtitle', e.target.value)} placeholder="What we've built" className={inputCls} />
                </Field>
            </FieldGroup>
            <FieldGroup label="Display">
                <Field label="Items to show">
                    <Input type="number" value={content.limit || 6} min={1} max={12} onChange={e => handleChange('limit', parseInt(e.target.value))} className={inputCls} />
                </Field>
            </FieldGroup>
        </div>
    )

    if (type === 'contact') return (
        <div className="space-y-5">
            <FieldGroup label="Header">
                <Field label="Heading">
                    <Input value={content.heading || ''} onChange={e => handleChange('heading', e.target.value)} placeholder="Get in Touch" className={inputCls} />
                </Field>
            </FieldGroup>
            <FieldGroup label="Contact Details">
                <Field label="Phone">
                    <Input value={content.phone || ''} onChange={e => handleChange('phone', e.target.value)} placeholder="+91 99999 00000" className={inputCls} />
                </Field>
                <Field label="Email">
                    <Input value={content.email || ''} onChange={e => handleChange('email', e.target.value)} placeholder="hello@company.com" className={inputCls} />
                </Field>
                <Field label="Address">
                    <Textarea value={content.address || ''} onChange={e => handleChange('address', e.target.value)} placeholder="123 Main St…" className={textareaCls} />
                </Field>
            </FieldGroup>
        </div>
    )

    return (
        <div className="p-4 text-center text-slate-400 text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No editable fields for this section type.
        </div>
    )
}

function StyleForm({ section, handleChange }) {
    const { content } = section
    return (
        <div className="space-y-5">
            <FieldGroup label="Colors">
                <Field label="Background">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                            style={{ background: content.bgColor || '#ffffff' }}
                        />
                        <Input
                            type="color"
                            value={content.bgColor || '#ffffff'}
                            onChange={e => handleChange('bgColor', e.target.value)}
                            className="h-8 w-full cursor-pointer bg-white border-slate-200"
                        />
                    </div>
                </Field>
                <Field label="Text Color">
                    <div className="flex items-center gap-2">
                        <div
                            className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer shrink-0"
                            style={{ background: content.textColor || '#111111' }}
                        />
                        <Input
                            type="color"
                            value={content.textColor || '#111111'}
                            onChange={e => handleChange('textColor', e.target.value)}
                            className="h-8 w-full cursor-pointer bg-white border-slate-200"
                        />
                    </div>
                </Field>
            </FieldGroup>

            <FieldGroup label="Spacing">
                <Field label={`Padding Top: ${content.paddingTop ?? 64}px`}>
                    <input
                        type="range" min={0} max={160} step={8}
                        value={content.paddingTop ?? 64}
                        onChange={e => handleChange('paddingTop', Number(e.target.value))}
                        className="w-full accent-blue-500"
                    />
                </Field>
                <Field label={`Padding Bottom: ${content.paddingBottom ?? 64}px`}>
                    <input
                        type="range" min={0} max={160} step={8}
                        value={content.paddingBottom ?? 64}
                        onChange={e => handleChange('paddingBottom', Number(e.target.value))}
                        className="w-full accent-blue-500"
                    />
                </Field>
            </FieldGroup>

            <FieldGroup label="Alignment">
                <Field label="Text Align">
                    <div className="flex gap-1">
                        {[
                            { value: 'left', Icon: AlignLeft },
                            { value: 'center', Icon: AlignCenter },
                            { value: 'right', Icon: AlignRight },
                        ].map(({ value, Icon }) => (
                            <button
                                key={value}
                                onClick={() => handleChange('textAlign', value)}
                                className={cn(
                                    'flex-1 flex items-center justify-center h-8 rounded-md border text-xs transition-colors',
                                    (content.textAlign || 'left') === value
                                        ? 'bg-blue-50 border-blue-300 text-blue-600'
                                        : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                )}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                </Field>
            </FieldGroup>
        </div>
    )
}

function AdvancedForm({ section, handleChange }) {
    const { content } = section
    return (
        <div className="space-y-5">
            <FieldGroup label="Anchor">
                <Field label="Section ID / Anchor">
                    <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">#</span>
                        <Input
                            value={content.anchorId || ''}
                            onChange={e => handleChange('anchorId', e.target.value)}
                            placeholder="e.g. about-us"
                            className={cn(inputCls, 'pl-5')}
                        />
                    </div>
                    <p className="text-[10px] text-slate-400">Used for navigation links like <code className="text-slate-500">#about-us</code></p>
                </Field>
            </FieldGroup>

            <FieldGroup label="Visibility">
                <Field label="">
                    <div className="space-y-2">
                        {[
                            { key: 'showOnDesktop', Icon: Monitor, label: 'Show on Desktop' },
                            { key: 'showOnMobile', Icon: Smartphone, label: 'Show on Mobile' },
                        ].map(({ key, Icon, label }) => (
                            <label key={key} className="flex items-center justify-between p-2.5 rounded-lg cursor-pointer group bg-slate-50 border border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                                    <span className="text-xs font-medium text-slate-700">{label}</span>
                                </div>
                                <Switch
                                    checked={content[key] !== false}
                                    onCheckedChange={val => handleChange(key, val)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </label>
                        ))}
                    </div>
                </Field>
            </FieldGroup>

            <FieldGroup label="Custom CSS Class">
                <Field label="Extra CSS Classes">
                    <Input
                        value={content.customClass || ''}
                        onChange={e => handleChange('customClass', e.target.value)}
                        placeholder="e.g. my-section"
                        className={inputCls}
                    />
                </Field>
            </FieldGroup>
        </div>
    )
}

export default function SectionEditor({ section, onChange, onClose }) {
    const [activeTab, setActiveTab] = useState('content')

    if (!section) return null

    const handleChange = (field, value) => {
        onChange({ ...section, content: { ...section.content, [field]: value } })
    }

    const IconComp = SECTION_ICONS[section.type] || FileText
    const gradColor = SECTION_COLORS[section.type] || 'from-slate-400 to-slate-500'

    return (
        <aside
            className="w-72 shrink-0 flex flex-col border-l bg-white border-slate-200 animate-in slide-in-from-right duration-200"
        >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
                <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0', gradColor)}>
                    <IconComp className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 capitalize">{section.type} Section</p>
                    <p className="text-[10px] text-slate-400">Properties</p>
                </div>
                <button
                    onClick={onClose}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
                {TABS.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={cn(
                            'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2',
                            activeTab === id
                                ? 'text-blue-600 border-blue-500 bg-blue-50/50'
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
                {activeTab === 'content' && <ContentForm section={section} handleChange={handleChange} />}
                {activeTab === 'style' && <StyleForm section={section} handleChange={handleChange} />}
                {activeTab === 'advanced' && <AdvancedForm section={section} handleChange={handleChange} />}
            </div>
        </aside>
    )
}
