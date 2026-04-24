// PublicSectionRenderer uses dedicated public components
// to ensure the live site is optimized and bypasses builder-only logic.
import HeroSection from '@/components/website-public/sections/HeroSection'
import AboutSection from '@/components/website-public/sections/AboutSection'
import ProjectsSection from '@/components/website-public/sections/ProjectsSection'
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
