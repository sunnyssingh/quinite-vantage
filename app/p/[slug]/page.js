import { createClient } from '@/lib/supabase/client'
import PublicSectionRenderer from '@/components/website-public/PublicSectionRenderer'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }) {
    const { slug } = await params
    const supabase = createClient()

    const { data: org } = await supabase
        .from('organizations')
        .select('name, website_config')
        .eq('slug', slug)
        .single()

    if (!org) return { title: 'Not Found' }

    return {
        title: org.website_config?.settings?.siteName || org.name,
        description: 'Welcome to our official website.',
        icons: {
            icon: org.website_config?.settings?.logoUrl || '/favicon.ico'
        }
    }
}

export default async function PublicProfilePage({ params }) {
    const { slug } = await params
    const supabase = createClient()

    // Fetch organization and config
    const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !org) {
        return notFound()
    }

    const config = org.website_config || {}
    const sections = config.sections || []
    const settings = config.settings || {}

    // Theme Variables (Inline Styles for simplicity in this MVP)
    const themeStyles = {
        '--primary': settings.primaryColor || '#0f172a',
        '--primary-foreground': '#ffffff',
        // We could calculate contrast color here
    }

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900" style={themeStyles}>
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl">
                        {settings.logoUrl && (
                            <img src={settings.logoUrl} alt="Logo" className="h-8 w-auto object-contain" />
                        )}
                        <span>{settings.siteName || org.name}</span>
                    </div>
                    <nav className="hidden md:flex gap-6 text-sm font-medium">
                        <Link href={`/p/${slug}`} className="transition-colors hover:text-primary">Home</Link>
                        <Link href={`/p/${slug}#projects`} className="transition-colors hover:text-primary">Projects</Link>
                        <Link href={`/p/${slug}#about`} className="transition-colors hover:text-primary">About</Link>
                        <Link href={`/p/${slug}#contact`} className="transition-colors hover:text-primary">Contact</Link>
                    </nav>
                    <button className="md:hidden">
                        {/* Mobile Menu Trigger */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
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
                                slug={slug}
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
                    <p className="mt-2">Powered by Quinite Vantage</p>
                </div>
            </footer>
        </div>
    )
}
