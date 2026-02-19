'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

// ─── 3 Curated Templates ──────────────────────────────────────────────────────

const TEMPLATES = [
    {
        id: 'tpl_luxe',
        name: 'Luxe Estate',
        tag: 'Premium',
        tagColor: 'bg-amber-50 text-amber-700 border-amber-200',
        description: 'Dark, cinematic hero with gold accents. Perfect for luxury developers.',
        // SVG inline preview
        preview: (
            <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="320" height="200" fill="#0c1220" />
                {/* Nav */}
                <rect x="0" y="0" width="320" height="28" fill="#111827" />
                <rect x="16" y="9" width="40" height="6" rx="2" fill="#c9a84c" opacity="0.9" />
                <rect x="220" y="10" width="24" height="4" rx="1" fill="#6b7280" />
                <rect x="252" y="10" width="24" height="4" rx="1" fill="#6b7280" />
                <rect x="284" y="9" width="22" height="6" rx="3" fill="#c9a84c" />
                {/* Hero */}
                <rect x="0" y="28" width="320" height="100" fill="#0f172a" />
                <rect x="20" y="45" width="60" height="4" rx="1" fill="#c9a84c" opacity="0.6" />
                <rect x="20" y="55" width="180" height="10" rx="2" fill="#ffffff" />
                <rect x="20" y="71" width="140" height="10" rx="2" fill="#ffffff" opacity="0.6" />
                <rect x="20" y="87" width="100" height="8" rx="2" fill="#ffffff" opacity="0.3" />
                <rect x="20" y="103" width="64" height="14" rx="3" fill="#c9a84c" />
                <rect x="92" y="103" width="64" height="14" rx="3" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
                {/* Cards row */}
                <rect x="0" y="132" width="320" height="68" fill="#111827" />
                <rect x="14" y="140" width="82" height="52" rx="4" fill="#1e293b" />
                <rect x="14" y="176" width="60" height="3" rx="1" fill="#c9a84c" opacity="0.4" />
                <rect x="104" y="140" width="82" height="52" rx="4" fill="#1e293b" />
                <rect x="104" y="176" width="50" height="3" rx="1" fill="#c9a84c" opacity="0.4" />
                <rect x="195" y="140" width="82" height="52" rx="4" fill="#1e293b" />
                <rect x="195" y="176" width="55" height="3" rx="1" fill="#c9a84c" opacity="0.4" />
                {/* Accent shimmer */}
                <rect x="0" y="28" width="3" height="100" fill="#c9a84c" opacity="0.5" />
            </svg>
        ),
        config: {
            sections: [
                {
                    id: `hero-${Date.now()}-1`,
                    type: 'hero',
                    content: {
                        title: 'Crafting Iconic Spaces',
                        subtitle: 'Award-winning real estate development focused on luxury living and architectural excellence.',
                        buttonText: 'Explore Projects',
                        backgroundColor: '#0f172a',
                        textColor: '#ffffff',
                    }
                },
                {
                    id: `about-${Date.now()}-2`,
                    type: 'about',
                    content: {
                        heading: 'A Legacy of Excellence',
                        text: 'With over a decade of shaping skylines, we bring together visionary architecture, meticulous craftsmanship, and a commitment to sustainable luxury. Every project is a statement.'
                    }
                },
                {
                    id: `projects-${Date.now()}-3`,
                    type: 'projects',
                    content: {
                        title: 'Signature Developments',
                        description: 'A curated portfolio of award‑winning properties.'
                    }
                },
                {
                    id: `contact-${Date.now()}-4`,
                    type: 'contact',
                    content: {
                        heading: 'Begin Your Journey',
                        subtext: 'Connect with our team to explore exclusive opportunities.'
                    }
                }
            ],
            settings: {
                primaryColor: '#0f172a',
                secondaryColor: '#c9a84c',
            }
        }
    },
    {
        id: 'tpl_arc',
        name: 'Arc Studio',
        tag: 'Minimal',
        tagColor: 'bg-slate-50 text-slate-600 border-slate-200',
        description: 'Pure white canvas with bold typography. Ideal for boutique studios.',
        preview: (
            <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="320" height="200" fill="#ffffff" />
                {/* Nav */}
                <rect x="0" y="0" width="320" height="24" fill="#ffffff" />
                <line x1="0" y1="24" x2="320" y2="24" stroke="#e2e8f0" strokeWidth="1" />
                <rect x="16" y="8" width="32" height="5" rx="1.5" fill="#0f172a" />
                <rect x="220" y="9" width="22" height="3" rx="1" fill="#94a3b8" />
                <rect x="250" y="9" width="22" height="3" rx="1" fill="#94a3b8" />
                <rect x="280" y="9" width="22" height="3" rx="1" fill="#94a3b8" />
                {/* Hero — big bold text */}
                <rect x="0" y="24" width="320" height="96" fill="#ffffff" />
                <rect x="20" y="36" width="220" height="16" rx="2" fill="#0f172a" />
                <rect x="20" y="58" width="160" height="16" rx="2" fill="#0f172a" />
                <rect x="20" y="80" width="110" height="8" rx="1.5" fill="#94a3b8" />
                <rect x="20" y="96" width="56" height="12" rx="2" fill="#0f172a" />
                <rect x="84" y="96" width="56" height="12" rx="2" fill="none" stroke="#0f172a" strokeWidth="1.5" />
                {/* Two-col grid */}
                <rect x="0" y="124" width="320" height="76" fill="#f8fafc" />
                <rect x="16" y="134" width="130" height="56" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <rect x="24" y="166" width="80" height="4" rx="1" fill="#0f172a" opacity="0.3" />
                <rect x="174" y="134" width="130" height="56" rx="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
                <rect x="182" y="166" width="70" height="4" rx="1" fill="#0f172a" opacity="0.3" />
            </svg>
        ),
        config: {
            sections: [
                {
                    id: `hero-${Date.now()}-1`,
                    type: 'hero',
                    content: {
                        title: 'Less is More.',
                        subtitle: 'Boutique architecture and development studio focused on clean, purposeful, and timeless spaces.',
                        buttonText: 'View Work',
                        backgroundColor: '#ffffff',
                        textColor: '#0f172a',
                    }
                },
                {
                    id: `projects-${Date.now()}-2`,
                    type: 'projects',
                    content: {
                        title: 'Selected Works',
                        description: 'A focused selection of our best architectural endeavors.'
                    }
                },
                {
                    id: `about-${Date.now()}-3`,
                    type: 'about',
                    content: {
                        heading: 'Studio Philosophy',
                        text: 'We believe architecture should speak quietly and confidently. Our work strips away the unnecessary to reveal spaces that are as functional as they are beautiful.'
                    }
                },
                {
                    id: `contact-${Date.now()}-4`,
                    type: 'contact',
                    content: {
                        heading: 'Let\'s Talk',
                        subtext: 'We\'d love to hear about your next project.'
                    }
                }
            ],
            settings: {
                primaryColor: '#0f172a',
                secondaryColor: '#64748b',
                siteName: '',
            }
        }
    },
    {
        id: 'tpl_vivid',
        name: 'Vivid Blue',
        tag: 'Bold',
        tagColor: 'bg-blue-50 text-blue-700 border-blue-200',
        description: 'Clean, professional, and high-energy. Built for growth-focused brands.',
        preview: (
            <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <rect width="320" height="200" fill="#f0f7ff" />
                {/* Nav */}
                <rect x="0" y="0" width="320" height="26" fill="#ffffff" />
                <line x1="0" y1="26" x2="320" y2="26" stroke="#dbeafe" strokeWidth="1" />
                <rect x="16" y="8" width="40" height="8" rx="4" fill="#2563eb" />
                <rect x="208" y="10" width="24" height="4" rx="1" fill="#94a3b8" />
                <rect x="240" y="10" width="24" height="4" rx="1" fill="#94a3b8" />
                <rect x="272" y="8" width="32" height="8" rx="4" fill="#2563eb" />
                {/* Hero gradient */}
                <defs>
                    <linearGradient id="gvivid" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1d4ed8" />
                        <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                </defs>
                <rect x="0" y="26" width="320" height="90" fill="url(#gvivid)" />
                <rect x="20" y="38" width="48" height="6" rx="2" fill="#93c5fd" opacity="0.7" />
                <rect x="20" y="52" width="200" height="12" rx="2" fill="#ffffff" />
                <rect x="20" y="70" width="150" height="8" rx="1.5" fill="#bfdbfe" opacity="0.8" />
                <rect x="20" y="86" width="64" height="14" rx="3" fill="#ffffff" />
                <rect x="92" y="86" width="64" height="14" rx="3" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
                {/* 3-col cards */}
                <rect x="0" y="120" width="320" height="80" fill="#f0f7ff" />
                <rect x="12" y="128" width="88" height="60" rx="5" fill="#ffffff" stroke="#dbeafe" strokeWidth="1" />
                <rect x="16" y="134" width="80" height="28" rx="3" fill="#dbeafe" />
                <rect x="18" y="168" width="50" height="4" rx="1" fill="#0f172a" opacity="0.3" />
                <rect x="108" y="128" width="88" height="60" rx="5" fill="#ffffff" stroke="#dbeafe" strokeWidth="1" />
                <rect x="112" y="134" width="80" height="28" rx="3" fill="#dbeafe" />
                <rect x="114" y="168" width="55" height="4" rx="1" fill="#0f172a" opacity="0.3" />
                <rect x="204" y="128" width="88" height="60" rx="5" fill="#ffffff" stroke="#dbeafe" strokeWidth="1" />
                <rect x="208" y="134" width="80" height="28" rx="3" fill="#dbeafe" />
                <rect x="210" y="168" width="45" height="4" rx="1" fill="#0f172a" opacity="0.3" />
            </svg>
        ),
        config: {
            sections: [
                {
                    id: `hero-${Date.now()}-1`,
                    type: 'hero',
                    content: {
                        title: 'Build. Grow. Inspire.',
                        subtitle: 'Modern real estate development with a forward-thinking approach. Quality homes, delivered on time.',
                        buttonText: 'See Projects',
                        backgroundColor: '#1d4ed8',
                        textColor: '#ffffff',
                    }
                },
                {
                    id: `projects-${Date.now()}-2`,
                    type: 'projects',
                    content: {
                        title: 'Featured Projects',
                        description: 'Explore our growing portfolio of residential and commercial developments.'
                    }
                },
                {
                    id: `about-${Date.now()}-3`,
                    type: 'about',
                    content: {
                        heading: 'Who We Are',
                        text: 'A dynamic real estate company built on transparency, innovation, and community. We bring fresh thinking to every project we deliver.'
                    }
                },
                {
                    id: `contact-${Date.now()}-4`,
                    type: 'contact',
                    content: {
                        heading: 'Get in Touch',
                        subtext: 'Our team is ready to help you find or build your next home.'
                    }
                }
            ],
            settings: {
                primaryColor: '#2563eb',
                secondaryColor: '#1d4ed8',
            }
        }
    }
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function TemplateSelector({ isOpen, onClose, onSelect }) {
    const [selected, setSelected] = useState(null)
    const [confirming, setConfirming] = useState(false)

    const handleClose = () => {
        setSelected(null)
        setConfirming(false)
        onClose()
    }

    const handleContinue = () => {
        if (!selected) return
        setConfirming(true)
    }

    const handleConfirm = () => {
        onSelect(selected.config)
        handleClose()
        toast.success(`"${selected.name}" applied`, { icon: '✨' })
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden flex flex-col gap-0 bg-white border-0 shadow-2xl rounded-2xl">

                {/* Header */}
                <div className="px-8 pt-7 pb-5 border-b border-slate-100">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2.5 text-xl font-bold text-slate-900">
                            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            Choose a Template
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 text-sm mt-1">
                            Pick a design to jumpstart your website. You can customise everything after.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {!confirming ? (
                        <div className="p-8 grid grid-cols-3 gap-5">
                            {TEMPLATES.map(tpl => {
                                const isSelected = selected?.id === tpl.id
                                return (
                                    <button
                                        key={tpl.id}
                                        onClick={() => setSelected(tpl)}
                                        className={`group text-left rounded-xl overflow-hidden border-2 transition-all duration-200 focus:outline-none ${isSelected
                                                ? 'border-blue-600 shadow-lg shadow-blue-100 scale-[1.02]'
                                                : 'border-transparent hover:border-slate-200 hover:shadow-md'
                                            }`}
                                    >
                                        {/* Preview */}
                                        <div className="relative aspect-[16/10] bg-slate-50 overflow-hidden">
                                            {tpl.preview}
                                            {/* Selected overlay */}
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-blue-600/10 flex items-end justify-end p-2">
                                                    <div className="bg-blue-600 text-white rounded-full p-1">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="p-4 bg-white">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-bold text-slate-900 text-sm">{tpl.name}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${tpl.tagColor}`}>
                                                    {tpl.tag}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{tpl.description}</p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center text-center px-10 py-16 space-y-5">
                            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center">
                                <AlertTriangle className="w-8 h-8 text-amber-500" />
                            </div>
                            <div className="space-y-2 max-w-sm">
                                <h3 className="text-xl font-bold text-slate-900">Replace current design?</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">
                                    Applying <span className="font-semibold text-slate-700">{selected?.name}</span> will overwrite your existing sections. This cannot be undone.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
                    {!confirming ? (
                        <>
                            <span className="text-xs text-slate-400">
                                {selected ? `Selected: ${selected.name}` : 'Select a template to continue'}
                            </span>
                            <div className="flex gap-3">
                                <Button variant="outline" onClick={handleClose} className="rounded-lg px-5 text-sm">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleContinue}
                                    disabled={!selected}
                                    className="rounded-lg px-6 text-sm bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm shadow-blue-200"
                                >
                                    Continue <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="flex gap-3 w-full justify-end">
                            <Button variant="ghost" onClick={() => setConfirming(false)} className="rounded-lg px-5 text-sm">
                                Go Back
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                className="rounded-lg px-6 text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200"
                            >
                                Yes, Replace Design
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
