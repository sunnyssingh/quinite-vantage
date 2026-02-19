'use client'

import { useState } from 'react'
import { Settings, X, Globe, Palette, Phone } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const TABS = [
    { id: 'brand', label: 'Brand', Icon: Globe },
    { id: 'theme', label: 'Theme', Icon: Palette },
    { id: 'contact', label: 'Contact', Icon: Phone },
]

const inputCls = "h-9 text-sm bg-white border-slate-200 text-slate-800 placeholder:text-slate-300 focus:border-blue-400 focus:ring-0 focus:ring-offset-0"

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">{label}</Label>
            {children}
            {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
        </div>
    )
}

export default function SiteSettingsEditor({ config, onChange, onClose }) {
    const [activeTab, setActiveTab] = useState('brand')
    const settings = config?.settings || {}

    const update = (key, value) => {
        onChange({ settings: { ...settings, [key]: value } })
    }

    return (
        <aside className="w-72 shrink-0 flex flex-col border-l bg-white border-slate-200">

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
                    <Settings className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">Site Settings</p>
                    <p className="text-[10px] text-slate-400">Global configuration</p>
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
                            'flex-1 flex flex-col items-center gap-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors border-b-2',
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
            <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar bg-slate-50/50">

                {activeTab === 'brand' && (
                    <>
                        <Field label="Site Name" hint="Displayed in the top navigation">
                            <Input
                                value={settings.siteName || ''}
                                onChange={e => update('siteName', e.target.value)}
                                placeholder="e.g. Acme Properties"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Logo URL" hint="Direct image URL (PNG, SVG, etc.)">
                            <Input
                                value={settings.logoUrl || ''}
                                onChange={e => update('logoUrl', e.target.value)}
                                placeholder="https://…/logo.png"
                                className={inputCls}
                            />
                        </Field>
                        {settings.logoUrl && (
                            <div className="p-3 bg-white rounded-xl border border-slate-200">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
                                <img
                                    src={settings.logoUrl}
                                    alt="Logo preview"
                                    className="h-10 max-w-full object-contain"
                                    onError={e => { e.target.style.display = 'none' }}
                                />
                            </div>
                        )}
                        <Field label="Site Description" hint="Used for SEO meta description">
                            <Input
                                value={settings.description || ''}
                                onChange={e => update('description', e.target.value)}
                                placeholder="A brief description…"
                                className={inputCls}
                            />
                        </Field>
                    </>
                )}

                {activeTab === 'theme' && (
                    <>
                        <Field label="Primary Color">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                                    style={{ background: settings.primaryColor || '#3b82f6' }}
                                />
                                <Input
                                    type="color"
                                    value={settings.primaryColor || '#3b82f6'}
                                    onChange={e => update('primaryColor', e.target.value)}
                                    className="h-9 cursor-pointer bg-white border-slate-200"
                                />
                            </div>
                        </Field>
                        <Field label="Secondary Color">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                                    style={{ background: settings.secondaryColor || '#64748b' }}
                                />
                                <Input
                                    type="color"
                                    value={settings.secondaryColor || '#64748b'}
                                    onChange={e => update('secondaryColor', e.target.value)}
                                    className="h-9 cursor-pointer bg-white border-slate-200"
                                />
                            </div>
                        </Field>
                        <Field label="Nav Background">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-9 h-9 rounded-xl border border-slate-200 cursor-pointer shrink-0"
                                    style={{ background: settings.navBg || '#ffffff' }}
                                />
                                <Input
                                    type="color"
                                    value={settings.navBg || '#ffffff'}
                                    onChange={e => update('navBg', e.target.value)}
                                    className="h-9 cursor-pointer bg-white border-slate-200"
                                />
                            </div>
                        </Field>
                    </>
                )}

                {activeTab === 'contact' && (
                    <>
                        <Field label="Contact Email">
                            <Input
                                type="email"
                                value={settings.contactEmail || ''}
                                onChange={e => update('contactEmail', e.target.value)}
                                placeholder="hello@company.com"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Phone Number">
                            <Input
                                value={settings.contactPhone || ''}
                                onChange={e => update('contactPhone', e.target.value)}
                                placeholder="+91 99999 00000"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="Office Address">
                            <Input
                                value={settings.address || ''}
                                onChange={e => update('address', e.target.value)}
                                placeholder="123 Main St, City"
                                className={inputCls}
                            />
                        </Field>
                        <Field label="WhatsApp Number" hint="e.g. 919999900000 (no '+' or spaces)">
                            <Input
                                value={settings.whatsapp || ''}
                                onChange={e => update('whatsapp', e.target.value)}
                                placeholder="919999900000"
                                className={inputCls}
                            />
                        </Field>
                    </>
                )}
            </div>
        </aside>
    )
}
