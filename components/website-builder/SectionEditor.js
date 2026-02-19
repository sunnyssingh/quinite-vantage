import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { X, Type, Image as ImageIcon, Layout, Palette, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default function SectionEditor({ section, onChange, onClose }) {
    if (!section) return null

    const handleChange = (field, value) => {
        onChange({
            ...section,
            content: {
                ...section.content,
                [field]: value
            }
        })
    }

    return (
        <div className="w-80 bg-white/95 backdrop-blur-sm border-l border-slate-200 flex flex-col h-full shrink-0 shadow-2xl z-20 animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getIconBgColor(section.type)}`}>
                        <EditIcon type={section.type} />
                    </div>
                    <div>
                        <h2 className="font-bold text-sm text-slate-900 capitalize leading-tight">
                            {section.type} Section
                        </h2>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Properties</p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 rounded-full" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            {/* Content Form */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
                {section.type === 'hero' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Content</Label>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Headline</Label>
                                    <Input
                                        value={section.content.title || ''}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        placeholder="Enter main title"
                                        className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Subtitle</Label>
                                    <Textarea
                                        value={section.content.subtitle || ''}
                                        onChange={(e) => handleChange('subtitle', e.target.value)}
                                        placeholder="Enter subtitle"
                                        className="min-h-[80px] bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-sm font-medium">Button Text</Label>
                                    <Input
                                        value={section.content.buttonText || ''}
                                        onChange={(e) => handleChange('buttonText', e.target.value)}
                                        placeholder="e.g. Contact Us"
                                        className="bg-slate-50 border-slate-200 focus:bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator className="bg-slate-100" />

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appearance</Label>

                            <div className="space-y-4">
                                <Label className="text-sm font-medium">Background Image URL (Link Only)</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={section.content.backgroundImage || ''}
                                        onChange={(e) => handleChange('backgroundImage', e.target.value)}
                                        placeholder="https://"
                                        className="bg-slate-50 border-slate-200 text-xs"
                                    />
                                    {/* Future: Upload Button */}
                                </div>
                                <p className="text-[10px] text-slate-400">Leave empty for solid color</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <ColorPicker
                                    label="Text Color"
                                    value={section.content.textColor || '#000000'}
                                    onChange={(val) => handleChange('textColor', val)}
                                />
                                <ColorPicker
                                    label="Background"
                                    value={section.content.backgroundColor || '#f8fafc'}
                                    onChange={(val) => handleChange('backgroundColor', val)}
                                />
                            </div>
                        </div>
                    </div>

                )}

                {section.type === 'projects' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Section Title</Label>
                                <Input
                                    value={section.content.title || ''}
                                    onChange={(e) => handleChange('title', e.target.value)}
                                    placeholder="Our Projects"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Description</Label>
                                <Textarea
                                    value={section.content.description || ''}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    placeholder="Browse our latest work..."
                                    className="resize-none bg-slate-50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500 leading-relaxed">
                            <p><strong>Note:</strong> This section automatically displays projects marked as "Public" in your CRM.</p>
                        </div>
                    </div>
                )}

                {section.type === 'about' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Heading</Label>
                                <Input
                                    value={section.content.heading || ''}
                                    onChange={(e) => handleChange('heading', e.target.value)}
                                    placeholder="About Us"
                                    className="bg-slate-50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Main Text</Label>
                                <Textarea
                                    value={section.content.text || ''}
                                    onChange={(e) => handleChange('text', e.target.value)}
                                    placeholder="Tell your story..."
                                    className="min-h-[150px] bg-slate-50 border-slate-200 resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Image URL (Link Only)</Label>
                                <Input
                                    value={section.content.image || ''}
                                    onChange={(e) => handleChange('image', e.target.value)}
                                    placeholder="https://"
                                    className="bg-slate-50 border-slate-200 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between border border-slate-200 p-3 rounded-lg bg-white shadow-sm">
                                <div className="space-y-0.5">
                                    <Label className="cursor-pointer text-sm font-medium">Show Image</Label>
                                    <p className="text-[10px] text-slate-400">Toggle image visibility</p>
                                </div>
                                <Switch
                                    checked={section.content.image !== false}
                                    onCheckedChange={(checked) => handleChange('image', checked)}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

function ColorPicker({ label, value, onChange }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-600">{label}</Label>
            <div className="flex items-center gap-2 p-1 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-slate-300 transition-colors">
                <div className="relative shrink-0 w-8 h-8 rounded-md overflow-hidden ring-1 ring-black/5">
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                    />
                </div>
                <Input
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-8 border-0 bg-transparent p-0 text-xs font-mono uppercase focus-visible:ring-0"
                />
            </div>
        </div>
    )
}

function EditIcon({ type }) {
    switch (type) {
        case 'hero': return <Type className="w-5 h-5 text-blue-600" />
        case 'about': return <ImageIcon className="w-5 h-5 text-purple-600" />
        case 'projects': return <Layout className="w-5 h-5 text-green-600" />
        default: return <Palette className="w-5 h-5 text-slate-600" />
    }
}

function getIconBgColor(type) {
    switch (type) {
        case 'hero': return 'bg-blue-100'
        case 'about': return 'bg-purple-100'
        case 'projects': return 'bg-green-100'
        default: return 'bg-slate-100'
    }
}
