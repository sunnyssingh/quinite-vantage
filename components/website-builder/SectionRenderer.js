import HeroSection from './sections/HeroSection'
import AboutSection from './sections/AboutSection'
import ProjectsSection from './sections/ProjectsSection'
import ContactSection from './sections/ContactSection'

export default function SectionRenderer({ type, content, organizationId }) {
    switch (type) {
        case 'hero':
            return <HeroSection content={content} />
        case 'about':
            return <AboutSection content={content} />
        case 'projects':
            return <ProjectsSection content={content} organizationId={organizationId} />
        case 'contact':
            return <ContactSection content={content} organizationId={organizationId} />
        default:
            return (
                <div className="py-8 text-center text-sm text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl mx-4 my-2">
                    Unknown section type: <strong>{type}</strong>
                </div>
            )
    }
}
