// PublicSectionRenderer re-uses the same section components as the builder
// so that the live site and preview always look identical.
import HeroSection from '@/components/website-builder/sections/HeroSection'
import AboutSection from '@/components/website-builder/sections/AboutSection'
import ProjectsSection from '@/components/website-builder/sections/ProjectsSection'
import ContactSection from '@/components/website-builder/sections/ContactSection'

export default function PublicSectionRenderer({ type, content, organizationId, slug }) {
    switch (type) {
        case 'hero':
            return <HeroSection content={content} />
        case 'about':
            return <AboutSection content={content} />
        case 'projects':
            return <ProjectsSection content={content} organizationId={organizationId} slug={slug} />
        case 'contact':
            return <ContactSection content={content} organizationId={organizationId} />
        default:
            return null
    }
}
