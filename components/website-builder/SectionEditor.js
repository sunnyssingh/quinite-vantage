import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { X, Type, Image as ImageIcon, Layout, Palette } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full shrink-0 shadow-xl z-20">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h2 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
                    <EditIcon type={section.type} />
                    Edit {section.type}
                </h2>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
                    <X className="w-4 h-4" />
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Common Fields */}

                {section.type === 'hero' && (
                    <>
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={section.content.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Enter title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Subtitle</Label>
                            <Textarea
                                value={section.content.subtitle || ''}
                                onChange={(e) => handleChange('subtitle', e.target.value)}
                                placeholder="Enter subtitle"
                                className="min-h-[80px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input
                                value={section.content.buttonText || ''}
                                onChange={(e) => handleChange('buttonText', e.target.value)}
                                placeholder="Start Now"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Text Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={section.content.textColor || '#000000'}
                                    onChange={(e) => handleChange('textColor', e.target.value)}
                                    className="h-9 w-9 p-0 border rounded cursor-pointer"
                                />
                                <Input
                                    value={section.content.textColor || '#000000'}
                                    onChange={(e) => handleChange('textColor', e.target.value)}
                                    className="font-mono text-xs uppercase"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Background Color</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={section.content.backgroundColor || '#f8fafc'}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="h-9 w-9 p-0 border rounded cursor-pointer"
                                />
                                <Input
                                    value={section.content.backgroundColor || '#f8fafc'}
                                    onChange={(e) => handleChange('backgroundColor', e.target.value)}
                                    className="font-mono text-xs uppercase"
                                />
                            </div>
                        </div>
                    </>
                )}

                {section.type === 'projects' && (
                    <>
                        <div className="space-y-2">
                            <Label>Section Title</Label>
                            <Input
                                value={section.content.title || ''}
                                onChange={(e) => handleChange('title', e.target.value)}
                                placeholder="Our Projects"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                                value={section.content.description || ''}
                                onChange={(e) => handleChange('description', e.target.value)}
                                placeholder="Browse our latest work..."
                            />
                        </div>
                    </>
                )}

                {section.type === 'about' && (
                    <>
                        <div className="space-y-2">
                            <Label>Heading</Label>
                            <Input
                                value={section.content.heading || ''}
                                onChange={(e) => handleChange('heading', e.target.value)}
                                placeholder="About Us"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Main Text</Label>
                            <Textarea
                                value={section.content.text || ''}
                                onChange={(e) => handleChange('text', e.target.value)}
                                placeholder="We are..."
                                className="min-h-[150px]"
                            />
                        </div>
                        <div className="flex items-center justify-between border p-3 rounded-lg">
                            <Label className="cursor-pointer">Show Image</Label>
                            <Switch
                                checked={section.content.image !== false}
                                onCheckedChange={(checked) => handleChange('image', checked)}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function EditIcon({ type }) {
    switch (type) {
        case 'hero': return <Type className="w-4 h-4 text-blue-500" />
        case 'about': return <ImageIcon className="w-4 h-4 text-purple-500" />
        case 'projects': return <Layout className="w-4 h-4 text-green-500" />
        default: return <Palette className="w-4 h-4 text-slate-500" />
    }
}
