'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ExternalLink, MapPin } from 'lucide-react'

const supabase = createClient()

function ProjectCard({ project }) {
    const thumbnail = project.image_url || null
    const projectStatus = project.project_status || project.status || 'active'
    const statusLabel = {
        planning: 'Planning',
        under_construction: 'Under Construction',
        ready_to_move: 'Ready to Move',
        completed: 'Completed',
        active: 'Active',
    }[projectStatus] || projectStatus
    const statusColors = {
        planning: { bg: '#dbeafe', text: '#1e40af' },
        under_construction: { bg: '#fef9c3', text: '#854d0e' },
        ready_to_move: { bg: '#dcfce7', text: '#166534' },
        completed: { bg: '#f0fdf4', text: '#15803d' },
        active: { bg: '#f1f5f9', text: '#475569' },
    }
    const sc = statusColors[projectStatus] || { bg: '#f1f5f9', text: '#475569' }
    const priceMin = project.price_range?.min
    const priceMax = project.price_range?.max

    return (
        <div className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={project.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 mx-auto bg-slate-200 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">{project.name}</p>
                        </div>
                    </div>
                )}
                {/* Status badge */}
                <span
                    className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                    style={{ background: sc.bg, color: sc.text }}
                >
                    {statusLabel}
                </span>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                        {project.name}
                    </h3>
                    {project.address && (
                        <p className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                            <MapPin className="w-3 h-3 shrink-0" />
                            <span className="truncate">{project.address}</span>
                        </p>
                    )}
                </div>

                {project.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                        {project.description}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                    {priceMin ? (
                        <span className="text-xs font-bold text-blue-600">
                            ₹{Number(priceMin).toLocaleString('en-IN')}{priceMax ? ` – ₹${Number(priceMax).toLocaleString('en-IN')}` : '+'}
                        </span>
                    ) : (
                        <span className="text-xs text-slate-300">Price on request</span>
                    )}
                    <button className="flex items-center gap-1 text-[11px] font-semibold text-blue-500 hover:text-blue-700 transition-colors">
                        View <ExternalLink className="w-3 h-3" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm animate-pulse">
            <div className="aspect-video bg-slate-100" />
            <div className="p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-4/5" />
            </div>
        </div>
    )
}

export default function ProjectsSection({ content = {}, organizationId }) {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)

    const {
        title = 'Our Projects',
        subtitle = 'Explore our portfolio of exceptional properties',
        bgColor = '#f8fafc',
        textColor = '#111827',
        paddingTop = 80,
        paddingBottom = 80,
        limit = 6,
    } = content

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                let q = supabase
                    .from('projects')
                    .select('id, name, description, address, project_status, status, price_range, image_url')
                    .order('created_at', { ascending: false })
                    .limit(limit)

                if (organizationId) q = q.eq('organization_id', organizationId)

                const { data } = await q
                setProjects(data || [])
            } catch {
                setProjects([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [organizationId, limit])

    return (
        <section
            style={{
                backgroundColor: bgColor,
                paddingTop: `${paddingTop}px`,
                paddingBottom: `${paddingBottom}px`,
            }}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Section header */}
                <div className="text-center mb-10">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4">
                        Portfolio
                    </span>
                    <h2
                        style={{ color: textColor }}
                        className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="mt-3 text-sm sm:text-base text-slate-500 max-w-xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {loading
                        ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                        : projects.length > 0
                            ? projects.map(p => <ProjectCard key={p.id} project={p} />)
                            : (
                                <div className="col-span-full text-center py-16">
                                    <div className="w-16 h-16 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                                        </svg>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">No projects to display yet</p>
                                    <p className="text-slate-300 text-xs mt-1">Projects added to your portfolio will appear here</p>
                                </div>
                            )
                    }
                </div>
            </div>
        </section>
    )
}
