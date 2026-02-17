import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Upload, Globe } from 'lucide-react'
import { useState } from 'react'

export default function SiteSettingsEditor({ config, onChange, onClose }) {
    // config is the whole website_config object
    // We typically want to edit config.settings or config.global

    const settings = config.settings || {}

    const handleChange = (field, value) => {
        onChange({
            ...config,
            settings: {
                ...settings,
                [field]: value
            }
        })
    }

    return (
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-xl z-20">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-500" />
                    Site Settings
                </h2>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Logo Section */}
                <div className="space-y-3">
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Brand & Logo</Label>
                    <div className="space-y-2">
                        <Label>Site Name</Label>
                        <Input
                            value={settings.siteName || ''}
                            onChange={(e) => handleChange('siteName', e.target.value)}
                            placeholder="My Real Estate"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <div className="flex gap-2">
                            <Input
                                value={settings.logoUrl || ''}
                                onChange={(e) => handleChange('logoUrl', e.target.value)}
                                placeholder="https://..."
                            />
                            {/* In a real app, integrate File Upload here */}
                            <Button variant="outline" size="icon" title="Upload (Mock)">
                                <Upload className="w-4 h-4" />
                            </Button>
                        </div>
                        {settings.logoUrl && (
                            <div className="mt-2 p-2 bg-slate-100 rounded border border-slate-200 flex justify-center">
                                <img src={settings.logoUrl} alt="Logo Preview" className="h-8 object-contain" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Theme Section */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Theme Colors</Label>
                    <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings.primaryColor || '#0f172a'}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="h-9 w-9 p-0 border rounded cursor-pointer"
                            />
                            <Input
                                value={settings.primaryColor || '#0f172a'}
                                onChange={(e) => handleChange('primaryColor', e.target.value)}
                                className="font-mono text-xs uppercase"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                value={settings.secondaryColor || '#64748b'}
                                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                className="h-9 w-9 p-0 border rounded cursor-pointer"
                            />
                            <Input
                                value={settings.secondaryColor || '#64748b'}
                                onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                className="font-mono text-xs uppercase"
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <Label className="text-xs uppercase tracking-wider text-slate-500">Contact Information</Label>
                    <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input
                            value={settings.email || ''}
                            onChange={(e) => handleChange('email', e.target.value)}
                            placeholder="info@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input
                            value={settings.phone || ''}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            placeholder="+1 234 567 890"
                        />
                    </div>
                </div>

            </div>
        </div>
    )
}
