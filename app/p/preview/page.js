import { createClient } from '@/lib/supabase/client'
import PublicSectionRenderer from '@/components/website-public/PublicSectionRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PreviewPage({ searchParams }) {
    const { id } = await searchParams
    const supabase = createClient()

    if (!id) return notFound()

    const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, website_config, settings, slug')
        .eq('id', id)
        .single()

    if (error || !org) {
        return notFound()
    }

    const config = org.website_config || {}
    const sections = config.sections || []
    const settings = config.settings || {}

    // Theme Variables
    const themeStyles = {
        '--primary': settings.primaryColor || '#0f172a',
        '--primary-foreground': '#ffffff',
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900" style={themeStyles}>
            {/* Preview Banner */}
            <div className="bg-blue-600 text-white text-center py-2 text-sm font-medium sticky top-0 z-[60]">
                Preview Mode - Changes may take a moment to reflect here.
            </div>

            {/* Header */}
            <header className="sticky top-8 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        {settings.logoUrl && (
                            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                        )}
                        <span>{settings.siteName || org.name}</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <Link href="#" className="transition-colors hover:text-primary pointer-events-none">Home</Link>
                        <Link href="#" className="transition-colors hover:text-primary pointer-events-none">Projects</Link>
                        <Link href="#" className="transition-colors hover:text-primary pointer-events-none">About</Link>
                        <Link href="#" className="transition-colors hover:text-primary pointer-events-none">Contact</Link>
                    </nav>
                </div>
            </header>

            <main>
                {sections.length > 0 ? (
                    sections.map(section => (
                        <div key={section.id} id={section.type}>
                            <PublicSectionRenderer
                                type={section.type}
                                content={section.content}
                                organizationId={org.id}
                                slug={org.slug || 'preview'}
                            />
                        </div>
                    ))
                ) : (
                    <div className="py-20 text-center">
                        <h1 className="text-2xl font-bold">Welcome to {org.name}</h1>
                        <p className="text-slate-500 mt-2">This site is currently being built.</p>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-50 py-12 text-center text-sm text-slate-500">
                <div className="container">
                    <p>&copy; {new Date().getFullYear()} {settings.siteName || org.name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}
