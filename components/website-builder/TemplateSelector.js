import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, LayoutTemplate, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function TemplateSelector({ isOpen, onClose, onSelect }) {
    const [templates, setTemplates] = useState([])
    const [loading, setLoading] = useState(true)
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
        setLoading(true)
        try {
            const supabase = createClient()
            console.log('Fetching templates...')
            const { data, error } = await supabase
                .from('website_templates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) throw error
            setTemplates(data || [])
        } catch (err) {
            console.error('Error fetching templates:', err)
            toast.error('Failed to load templates')
        } finally {
            setLoading(false)
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

    // Default templates if DB is empty (for demo purposes)
    const defaultTemplates = [
        {
            id: 'modern',
            name: 'Modern Minimal',
            description: 'Clean lines, plenty of whitespace, and a focus on typography.',
            thumbnail_url: null, // Placeholder in UI
            config: {
                settings: { primaryColor: '#0f172a', siteName: 'Modern Estate' },
                sections: [
                    { id: 'hero-1', type: 'hero', content: { title: 'Modern Living', subtitle: 'Experience the future of home.', backgroundColor: '#f8fafc', textColor: '#0f172a', showButton: true } },
                    { id: 'about-1', type: 'about', content: { heading: 'About Us', text: 'We build modern homes for modern families.' } },
                    { id: 'projects-1', type: 'projects', content: { title: 'Featured Projects' } }
                ]
            }
        },
        {
            id: 'luxury',
            name: 'Dark Luxury',
            description: 'Sophisticated dark theme with gold accents for premium properties.',
            thumbnail_url: null,
            config: {
                settings: { primaryColor: '#d4af37', siteName: 'Luxury Holdings' },
                sections: [
                    { id: 'hero-2', type: 'hero', content: { title: 'Exquisite Homes', subtitle: 'Defined by elegance.', backgroundColor: '#0f0f0f', textColor: '#d4af37', showButton: true, buttonText: 'View Collection' } },
                    { id: 'projects-2', type: 'projects', content: { title: 'Our Portfolio', description: 'A selection of our finest works.' } },
                    { id: 'about-2', type: 'about', content: { heading: 'Our Legacy', text: 'Decades of excellence in real estate.' } }
                ]
            }
        }
    ]

    const displayTemplates = templates.length > 0 ? templates : defaultTemplates

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <LayoutTemplate className="w-5 h-5 text-primary" />
                        Choose a Template
                    </DialogTitle>
                    <DialogDescription>
                        Select a pre-built design to start your website.
                        Warning: This will replace your current sections.
                    </DialogDescription>
                </DialogHeader>

                {!confirming ? (
                    <div className="flex-1 overflow-y-auto p-1 py-4">
                        {loading ? (
                            <div className="flex justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-slate-300" /></div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {displayTemplates.map(template => (
                                    <Card
                                        key={template.id}
                                        className={`cursor-pointer transition-all hover:shadow-md border-2 ${selectedTemplate?.id === template.id ? 'border-primary ring-2 ring-primary/20' : 'border-slate-100 hover:border-slate-200'}`}
                                        onClick={() => setSelectedTemplate(template)}
                                    >
                                        <div className="aspect-video bg-slate-100 relative overflow-hidden group">
                                            {template.thumbnail_url ? (
                                                <img src={template.thumbnail_url} alt={template.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 text-slate-300">
                                                    <LayoutTemplate className="w-12 h-12" />
                                                </div>
                                            )}
                                            {selectedTemplate?.id === template.id && (
                                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                    <div className="bg-primary text-white rounded-full p-2 shadow-lg">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <CardContent className="p-4">
                                            <h3 className="font-bold text-slate-900">{template.name}</h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 mt-1">{template.description}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                        <div className="bg-yellow-100 text-yellow-600 p-4 rounded-full">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Are you sure?</h3>
                            <p className="text-slate-600 max-w-sm mx-auto mt-2">
                                Applying the <strong>{selectedTemplate.name}</strong> template will replace all your current sections and settings. This cannot be undone.
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="mt-4 border-t pt-4">
                    {!confirming ? (
                        <>
                            <Button variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleApply} disabled={!selectedTemplate}>Continue</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setConfirming(false)}>Back</Button>
                            <Button variant="destructive" onClick={confirmApply}>Yes, Apply Template</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
