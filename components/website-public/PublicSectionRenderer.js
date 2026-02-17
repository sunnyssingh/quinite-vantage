import PublicHeroSection from './sections/HeroSection'
import PublicProjectsSection from './sections/ProjectsSection'
import PublicAboutSection from './sections/AboutSection'

export default function PublicSectionRenderer({ type, content, organizationId, slug }) {
    switch (type) {
        case 'hero':
            return <PublicHeroSection content={content} />
        case 'projects':
            return <PublicProjectsSection content={content} organizationId={organizationId} slug={slug} />
        case 'about':
            return <PublicAboutSection content={content} />
        case 'contact':
            return <div className="py-20 text-center bg-slate-50">Contact Section (Coming Soon)</div>
        default:
            return null
    }
}
