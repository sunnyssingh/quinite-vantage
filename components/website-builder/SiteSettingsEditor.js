import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Upload, Globe, Palette, Phone, Mail, Building } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

export default function SiteSettingsEditor({ config, onChange, onClose }) {
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
        <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-slate-200 flex flex-col h-full shrink-0 shadow-2xl z-20 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-slate-900 leading-tight">
                            Site Settings
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Global Config</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">

                {/* Brand Section */}
                <div className="space-y-4 animate-in fade-in duration-500 delay-75">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                        <Building className="w-4 h-4 text-slate-500" />
                        Brand Identity
                    </div>

                    <div className="space-y-4 pl-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600">Site Name</Label>
                            <Input
                                value={settings.siteName || ''}
                                onChange={(e) => handleChange('siteName', e.target.value)}
                                placeholder="My Real Estate Co."
                                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600">Logo URL</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={settings.logoUrl || ''}
                                    onChange={(e) => handleChange('logoUrl', e.target.value)}
                                    placeholder="https://..."
                                    className="bg-slate-50 border-slate-200 text-xs"
                                />
                                <Button variant="outline" size="icon" className="shrink-0 border-slate-200 bg-slate-50" title="Upload (Mock)">
                                    <Upload className="w-4 h-4 text-slate-500" />
                                </Button>
                            </div>
                            {settings.logoUrl && (
                                <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-center items-center h-16">
                                    <img src={settings.logoUrl} alt="Logo Preview" className="h-full object-contain" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Theme Section */}
                <div className="space-y-4 animate-in fade-in duration-500 delay-150">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                        <Palette className="w-4 h-4 text-slate-500" />
                        Theme & Colors
                    </div>

                    <div className="grid grid-cols-2 gap-4 pl-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600">Primary</Label>
                            <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                                <div className="relative shrink-0 w-8 h-8 rounded-md overflow-hidden ring-1 ring-black/5">
                                    <input
                                        type="color"
                                        value={settings.primaryColor || '#0f172a'}
                                        onChange={(e) => handleChange('primaryColor', e.target.value)}
                                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <Input
                                    value={settings.primaryColor || '#0f172a'}
                                    onChange={(e) => handleChange('primaryColor', e.target.value)}
                                    className="h-8 border-0 bg-transparent p-0 text-xs font-mono uppercase focus-visible:ring-0 w-full min-w-0"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600">Secondary</Label>
                            <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                                <div className="relative shrink-0 w-8 h-8 rounded-md overflow-hidden ring-1 ring-black/5">
                                    <input
                                        type="color"
                                        value={settings.secondaryColor || '#64748b'}
                                        onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                    />
                                </div>
                                <Input
                                    value={settings.secondaryColor || '#64748b'}
                                    onChange={(e) => handleChange('secondaryColor', e.target.value)}
                                    className="h-8 border-0 bg-transparent p-0 text-xs font-mono uppercase focus-visible:ring-0 w-full min-w-0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="bg-slate-100" />

                {/* Contact Info */}
                <div className="space-y-4 animate-in fade-in duration-500 delay-200">
                    <div className="flex items-center gap-2 text-slate-800 font-semibold text-sm">
                        <Phone className="w-4 h-4 text-slate-500" />
                        Contact Info
                    </div>

                    <div className="space-y-4 pl-1">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Email
                            </Label>
                            <Input
                                value={settings.email || ''}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="info@example.com"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                                <Phone className="w-3 h-3" /> Phone
                            </Label>
                            <Input
                                value={settings.phone || ''}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                placeholder="+1 234 567 890"
                                className="bg-slate-50 border-slate-200"
                            />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
