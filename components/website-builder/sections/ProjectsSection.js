import { useState, useEffect } from 'react'
import { Building2, MapPin, Bed, Bath, Ruler, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ProjectsSection({ content }) {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProjects = async () => {
            const supabase = createClient()
            try {
                // In builder, we show all projects that *would* be public
                // or just a sample of them. Let's show up to 3 public projects.
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('public_visibility', true)
                    .limit(3)

                if (!error && data) {
                    setProjects(data)
                }
            } catch (err) {
                console.error('Failed to fetch projects for preview', err)
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [])

    const getProjectDetails = (project) => {
        const meta = project.metadata || {}
        const realEstate = meta.real_estate || {}
        const residential = realEstate.property?.residential || {}
        const location = realEstate.location || {}
        const unitTypes = meta.unit_types || []

        // Image
        const image = project.image_url || realEstate.media?.thumbnail || null

        // Location
        const address = project.address || `${location.locality || ''}, ${location.city || ''}`
        const displayAddress = address.replace(/^, /, '') || 'Location unavailable'

        // Stats
        const bhk = residential.bhk || (unitTypes.length > 0 ? unitTypes[0].configuration : null)
        const area = residential.carpet_area || (unitTypes.length > 0 ? unitTypes[0].carpet_area : null)

        // Price
        // const price = unitTypes.length > 0 ? unitTypes[0].price : null

        return {
            image,
            address: displayAddress,
            bhk: bhk ? bhk.replace('bhk', ' BHK').toUpperCase() : null,
            area: area ? `${area} sqft` : null,
            type: realEstate.property?.use_case || project.project_type || 'Residential'
        }
    }

    return (
        <div className="w-full py-24 px-8 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl font-bold text-slate-900 tracking-tight">{content.title || 'Our Projects'}</h2>
                    {content.description && <p className="text-xl text-slate-600 max-w-2xl mx-auto font-light">{content.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 animate-pulse">
                                <div className="h-64 bg-slate-100" />
                                <div className="p-6 space-y-4">
                                    <div className="h-6 w-3/4 bg-slate-100 rounded" />
                                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                                    <div className="grid grid-cols-3 gap-4 pt-4">
                                        <div className="h-10 bg-slate-100 rounded" />
                                        <div className="h-10 bg-slate-100 rounded" />
                                        <div className="h-10 bg-slate-100 rounded" />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : projects.length > 0 ? (
                        projects.map((project) => {
                            const details = getProjectDetails(project)
                            return (
                                <div key={project.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 border border-slate-100 flex flex-col transform hover:-translate-y-1">
                                    {/* Image Container */}
                                    <div className="relative h-72 overflow-hidden">
                                        {details.image ? (
                                            <img
                                                src={details.image}
                                                alt={project.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-100">
                                                <Building2 className="w-16 h-16 text-slate-300" />
                                            </div>
                                        )}
                                        {/* Overlay Gradient */}
                                        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm uppercase tracking-wider">
                                            {project.status || 'Active'}
                                        </div>
                                    </div>

                                    <div className="p-6 flex-1 flex flex-col relative">
                                        {/* Floating Type Badge */}
                                        <div className="absolute -top-6 left-6">
                                            <span className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg">
                                                {details.type}
                                            </span>
                                        </div>

                                        <div className="pt-4 mb-4">
                                            <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors line-clamp-1">{project.name}</h3>
                                            <div className="flex items-center text-slate-500 text-sm font-medium">
                                                <MapPin className="w-4 h-4 mr-1.5 text-primary shrink-0" />
                                                <span className="truncate">{details.address}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 py-5 border-t border-slate-100 mt-auto">
                                            {[
                                                { icon: Bed, label: 'Beds', value: details.bhk },
                                                { icon: Bath, label: 'Baths', value: '- Baths' }, // Placeholder as we don't have bath data yet
                                                { icon: Ruler, label: 'Area', value: details.area }
                                            ].map((stat, idx) => (
                                                <div key={idx} className="flex flex-col items-center justify-center text-center p-2 rounded-lg bg-slate-50 group-hover:bg-primary/5 transition-colors">
                                                    <stat.icon className="w-5 h-5 text-slate-400 group-hover:text-primary mb-1 transition-colors" />
                                                    <span className="text-xs font-semibold text-slate-700">{stat.value || '-'}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-primary font-semibold text-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <span>View Details</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900">No projects to display</h3>
                            <p className="text-slate-500 mt-2">Projects marked as "Public" will appear here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
