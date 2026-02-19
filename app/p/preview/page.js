'use client'

import { Suspense, useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import SectionRenderer from '@/components/website-builder/SectionRenderer'
import Link from 'next/link'
import { Eye, X, Settings } from 'lucide-react'

// ─── Inner component (needs Suspense boundary for useSearchParams) ────────────

function PreviewContent() {
    const searchParams = useSearchParams()
    // Fix malformed URL: ?id=xxx?t=yyy — split on extra '?'
    const rawId = searchParams.get('id') || ''
    const id = rawId.split('?')[0]

    const [org, setOrg] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [bannerVisible, setBannerVisible] = useState(true)

    const fetchOrg = useCallback(async () => {
        if (!id) { setError('No organization ID provided.'); setLoading(false); return }
        try {
            const res = await fetch(`/api/organization/preview?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `Request failed (${res.status})`)
            }
            const data = await res.json()
            setOrg(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [id])

    useEffect(() => { fetchOrg() }, [fetchOrg])

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500 font-medium">Loading preview…</p>
            </div>
        </div>
    )

    if (error || !org) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-3 max-w-md px-6">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <Eye className="w-7 h-7 text-red-400" />
                </div>
                <h1 className="text-xl font-bold text-slate-800">Preview Unavailable</h1>
                <p className="text-slate-500 text-sm">{error || 'Organization not found.'}</p>
                <Link href="/dashboard/admin/website-builder"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline mt-2">
                    <Settings className="w-4 h-4" /> Return to Builder
                </Link>
            </div>
        </div>
    )

    const config = org.website_config || {}
    const sections = config.sections || []
    const settings = config.settings || {}
    const siteName = settings.siteName || org.company_name || 'Preview'
    const primary = settings.primaryColor || '#0f172a'

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900" style={{ '--primary': primary }}>
            {/* Preview Banner */}
            {bannerVisible && (
                <div className="bg-blue-600 text-white text-center py-2.5 text-xs font-semibold sticky top-0 z-[70] flex items-center justify-center gap-3 px-4">
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span>Preview Mode — This is how your site looks when published</span>
                    <div className="flex items-center gap-2 ml-2 shrink-0">
                        <Link
                            href="/dashboard/admin/website-builder"
                            className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-white text-xs font-medium transition-colors"
                        >
                            ← Back to Editor
                        </Link>
                        <button
                            onClick={() => setBannerVisible(false)}
                            className="hover:bg-white/20 p-1 rounded-full transition-colors"
                            aria-label="Dismiss"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Nav */}
            <header
                className="sticky z-50 w-full border-b border-slate-100 bg-white/90 backdrop-blur"
                style={{ top: bannerVisible ? '40px' : '0' }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-lg text-slate-900">
                        {settings.logoUrl ? (
                            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                        ) : (
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                                style={{ background: primary }}
                            >
                                {siteName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <span>{siteName}</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
                        {sections.some(s => s.type === 'hero') && <a href="#hero" className="hover:text-slate-900 transition-colors">Home</a>}
                        {sections.some(s => s.type === 'projects') && <a href="#projects" className="hover:text-slate-900 transition-colors">Projects</a>}
                        {sections.some(s => s.type === 'about') && <a href="#about" className="hover:text-slate-900 transition-colors">About</a>}
                        {sections.some(s => s.type === 'contact') && <a href="#contact" className="hover:text-slate-900 transition-colors">Contact</a>}
                    </nav>
                </div>
            </header>

            {/* Sections */}
            <main>
                {sections.length > 0 ? (
                    sections.map(section => (
                        <div key={section.id} id={section.type}>
                            <SectionRenderer
                                type={section.type}
                                content={section.content}
                                organizationId={id}
                                isPreview={true}
                            />
                        </div>
                    ))
                ) : (
                    <div className="py-32 text-center px-4">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Eye className="w-8 h-8 text-slate-400" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">{siteName}</h1>
                        <p className="text-slate-500 mt-2 text-sm">
                            No sections added yet. Go back to the builder to add sections.
                        </p>
                        <Link
                            href="/dashboard/admin/website-builder"
                            className="mt-6 inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                            <Settings className="w-4 h-4" /> Open Builder
                        </Link>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-100 bg-slate-50 py-10 text-center text-xs text-slate-400">
                <div className="max-w-7xl mx-auto px-4">
                    <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
                    <p className="mt-1">Powered by <span className="font-semibold text-slate-500">Quinite Vantage</span></p>
                </div>
            </footer>
        </div>
    )
}

// ─── Page wrapper with required Suspense boundary ────────────────────────────

export default function PreviewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <PreviewContent />
        </Suspense>
    )
}
