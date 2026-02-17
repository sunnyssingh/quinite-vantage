import HeroSection from './sections/HeroSection'
import ProjectsSection from './sections/ProjectsSection'
import AboutSection from './sections/AboutSection'

export default function SectionRenderer({ type, content }) {
    switch (type) {
        case 'hero':
            return <HeroSection content={content} />
        case 'projects':
            return <ProjectsSection content={content} />
        case 'about':
            return <AboutSection content={content} />
        case 'contact':
            return <div className="p-8 text-center bg-white">Contact Section (Coming Soon)</div>
        default:
            return <div className="p-4 text-center text-red-500">Unknown Section Type: {type}</div>
    }
}
