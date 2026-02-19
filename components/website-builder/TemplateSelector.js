import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, LayoutTemplate, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { toast } from 'react-hot-toast'

const DEFAULT_TEMPLATES = [
    {
        id: 'tpl_modern_real_estate',
        name: 'Modern Real Estate',
        description: 'A premium, high-conversion design tailored for luxury property developers. Features large imagery and clean typography.',
        is_default: true,
        thumbnail_url: 'https://placehold.co/600x400/0f172a/ffffff?text=Modern+Real+Estate',
        config: {
            sections: [
                {
                    id: 'hero-default',
                    type: 'hero',
                    content: {
                        title: 'Experience Luxury Living at Its Finest',
                        subtitle: 'Discover a world of elegance and comfort in our exclusive residential projects. Designed for those who appreciate the finer things in life, our homes offer a perfect blend of modern architecture and sustainable living.',
                        buttonText: 'View Our Projects',
                        backgroundImage: 'https://placehold.co/1920x1080/0f172a/ffffff?text=Hero+Background',
                        overlayOpacity: 0.5
                    }
                },
                {
                    id: 'about-default',
                    type: 'about',
                    content: {
                        heading: 'Building Dreams Since 2010',
                        text: 'At Quinite Estates, we believe that a home is more than just bricks and mortar. It is a sanctuary where memories are made. With over a decade of experience in the real estate industry, we have established ourselves as a trusted name in luxury property development. Our commitment to quality, innovation, and customer satisfaction sets us apart. We work with world-class architects and designers to create spaces that inspire and elevate your lifestyle.',
                        image: 'https://placehold.co/800x600/e2e8f0/64748b?text=About+Us'
                    }
                },
                {
                    id: 'projects-default',
                    type: 'projects',
                    content: {
                        title: 'Our Signature Developments',
                        description: 'Explore our portfolio of award-winning properties. From high-rise apartments in the city center to serene villas in the suburbs, we have something for every discerning buyer. Each project is a testament to our dedication to excellence.'
                    }
                }
            ],
            settings: {
                primaryColor: '#0f172a',
                secondaryColor: '#64748b'
            }
        }
    },
    {
        id: 'tpl_minimalist',
        name: 'Minimalist Portfolio',
        description: 'Clean, spacious, and focused on content. Perfect for architectural firms and design studios.',
        is_default: true,
        thumbnail_url: 'https://placehold.co/600x400/ffffff/000000?text=Minimalist',
        config: {
            sections: [
                {
                    id: 'hero-min',
                    type: 'hero',
                    content: {
                        title: 'Less is More. Design that Speaks.',
                        subtitle: 'We are a boutique architectural firm focused on creating minimalist, functional, and sustainable spaces. Our philosophy is rooted in the belief that simplicity is the ultimate sophistication.',
                        buttonText: 'See Our Work',
                        backgroundColor: '#ffffff',
                        textColor: '#000000'
                    }
                },
                {
                    id: 'projects-min',
                    type: 'projects',
                    content: {
                        title: 'Selected Works',
                        description: 'A curated selection of our most recent architectural endeavors. Each project represents a unique challenge and a bespoke solution.'
                    }
                }
            ],
            settings: {
                primaryColor: '#000000',
                secondaryColor: '#94a3b8'
            }
        }
    }
]

export default function TemplateSelector({ isOpen, onClose, onSelect }) {
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES)
    const [loading, setLoading] = useState(false) // Start false because we have defaults
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [confirming, setConfirming] = useState(false)

    useEffect(() => {
        if (isOpen) {
            fetchTemplates()
            setSelectedTemplate(null)
            setConfirming(false)
        }
    }, [isOpen])

    const fetchTemplates = async () => {
        // We don't set loading=true here to avoid flashing the loader if we already have defaults.
        // Or we can use a separate 'fetching' state if we want to show a small spinner.
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('website_templates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) {
                // Ignore 404/empty errors silently as we have defaults
                console.warn('Could not fetch custom templates:', error.message)
                return
            }

            if (data && data.length > 0) {
                setTemplates([...DEFAULT_TEMPLATES, ...data])
            }
        } catch (err) {
            console.error('Error fetching templates:', err)
        }
    }

    const handleApply = () => {
        if (!selectedTemplate) return
        setConfirming(true)
    }

    const confirmApply = () => {
        onSelect(selectedTemplate.config)
        onClose()
        toast.success(`Applied "${selectedTemplate.name}" template`)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 bg-slate-50/50 backdrop-blur-xl">
                <div className="p-6 border-b border-slate-100 bg-white/80">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Choose a Template
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Select a professionally designed template to jumpstart your website.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {!confirming ? (
                    <div className="flex-1 overflow-y-auto p-8">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <Loader2 className="animate-spin w-10 h-10 text-primary/50" />
                                <p className="text-slate-500 font-medium">Loading templates...</p>
                            </div>
                        ) : templates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {templates.map(template => (
                                    <div
                                        key={template.id}
                                        className={`group relative cursor-pointer rounded-xl transition-all duration-300 ${selectedTemplate?.id === template.id ? 'ring-2 ring-primary ring-offset-4 ring-offset-slate-50' : 'hover:-translate-y-1 hover:shadow-xl'
                                            }`}
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        <Card className="overflow-hidden border-0 shadow-md h-full flex flex-col">
                                            <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
                                                {template.thumbnail_url ? (
                                                    <img
                                                        src={template.thumbnail_url}
                                                        alt={template.name}
                                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-300 gap-2">
                                                        <LayoutTemplate className="w-12 h-12 stroke-1" />
                                                        <span className="text-xs font-medium uppercase tracking-wider opacity-50">No Preview</span>
                                                    </div>
                                                )}

                                                {/* Selection Overlay */}
                                                <div className={`absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-200 ${selectedTemplate?.id === template.id ? 'opacity-100' : 'opacity-0'}`}>
                                                    <div className="bg-white text-primary rounded-full p-3 shadow-lg transform scale-100 transition-transform">
                                                        <CheckCircle2 className="w-8 h-8" />
                                                    </div>
                                                </div>

                                                {/* Hover Overlay (Active when not selected) */}
                                                <div className={`absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${selectedTemplate?.id === template.id ? 'hidden' : ''}`}>
                                                    <Button variant="secondary" className="shadow-lg font-medium">Preview Design</Button>
                                                </div>
                                            </div>
                                            <CardContent className="p-5 flex-1 flex flex-col bg-white">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="font-bold text-slate-900 text-lg group-hover:text-primary transition-colors">{template.name}</h3>
                                                    {selectedTemplate?.id === template.id && (
                                                        <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">Selected</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">{template.description}</p>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                                <LayoutTemplate className="w-12 h-12 text-slate-300 mb-3" />
                                <h3 className="text-lg font-medium text-slate-900">No Templates Found</h3>
                                <p className="text-slate-500 max-w-sm mt-1">
                                    We couldn't find any templates. Try creating one from the builder first!
                                </p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
                        <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                        <div className="space-y-2 max-w-md mx-auto">
                            <h3 className="text-2xl font-bold text-slate-900">Replace current design?</h3>
                            <p className="text-slate-600">
                                Applying <strong>{selectedTemplate.name}</strong> will overwrite your existing sections and settings. This action cannot be undone.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-500 max-w-sm mx-auto">
                            <p><strong>Tip:</strong> Create a "Save as Template" of your current design first if you want to keep it.</p>
                        </div>
                    </div>
                )}

                <DialogFooter className="p-6 border-t border-slate-100 bg-white/80">
                    {!confirming ? (
                        <div className="flex justify-between w-full items-center">
                            <p className="text-sm text-slate-400 hidden md:block">
                                {selectedTemplate ? `Selected: ${selectedTemplate.name}` : 'Select a template to continue'}
                            </p>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={onClose} className="px-6">Cancel</Button>
                                <Button onClick={handleApply} disabled={!selectedTemplate} className="px-8 shadow-lg shadow-primary/20">
                                    Continue
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex gap-3 justify-center w-full">
                            <Button variant="ghost" onClick={() => setConfirming(false)} className="px-6">Go Back</Button>
                            <Button variant="destructive" onClick={confirmApply} className="px-8 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20">
                                Yes, Replace Everything
                            </Button>
                        </div>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

