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
        <div className="w-full py-16 px-8 bg-white">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-slate-900">{content.title || 'Our Projects'}</h2>
                    {content.description && <p className="mt-4 text-lg text-slate-600">{content.description}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pointer-events-none select-none">
                    {loading ? (
                        [1, 2, 3].map((i) => (
                            <div key={i} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
                                <div className="h-48 bg-slate-100" />
                                <div className="p-6 space-y-3">
                                    <div className="h-4 w-3/4 bg-slate-100 rounded" />
                                    <div className="h-4 w-1/2 bg-slate-100 rounded" />
                                </div>
                            </div>
                        ))
                    ) : projects.length > 0 ? (
                        projects.map((project) => {
                            const details = getProjectDetails(project)
                            return (
                                <div key={project.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col bg-white">
                                    <div className="h-56 bg-slate-100 relative group overflow-hidden">
                                        {details.image ? (
                                            <img
                                                src={details.image}
                                                alt={project.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50">
                                                <Building2 className="w-12 h-12 text-slate-300" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                            {project.status || 'Active'}
                                        </div>
                                    </div>

                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="text-xl font-bold text-slate-900 mb-1 truncate">{project.name}</h3>
                                        <div className="flex items-center text-slate-500 text-sm mb-4">
                                            <MapPin className="w-4 h-4 mr-1 shrink-0" />
                                            <span className="truncate">{details.address}</span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 py-4 border-t border-slate-100 mt-auto">
                                            {details.bhk ? (
                                                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg">
                                                    <Bed className="w-4 h-4 text-slate-400 mb-1" />
                                                    <span className="text-xs font-medium text-slate-700">{details.bhk}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg opacity-50">
                                                    <Bed className="w-4 h-4 text-slate-400 mb-1" />
                                                    <span className="text-xs text-slate-400">- Beds</span>
                                                </div>
                                            )}

                                            <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg opacity-50">
                                                <Bath className="w-4 h-4 text-slate-400 mb-1" />
                                                <span className="text-xs text-slate-400">- Baths</span>
                                            </div>

                                            {details.area ? (
                                                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg">
                                                    <Ruler className="w-4 h-4 text-slate-400 mb-1" />
                                                    <span className="text-xs font-medium text-slate-700">{details.area}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center p-2 bg-slate-50 rounded-lg opacity-50">
                                                    <Ruler className="w-4 h-4 text-slate-400 mb-1" />
                                                    <span className="text-xs text-slate-400">- SqFt</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="col-span-3 text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <h3 className="text-slate-900 font-medium">No projects found</h3>
                            <p className="text-slate-500 text-sm mt-1">Mark your projects as "Public" to see them here.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
