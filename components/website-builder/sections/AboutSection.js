import React from 'react'

const DEFAULT_HIGHLIGHTS = [
    { label: '10+ Years', desc: 'of Excellence' },
    { label: '500+', desc: 'Projects Completed' },
    { label: '98%', desc: 'Client Satisfaction' },
]

export default function AboutSection({ content = {} }) {
    const {
        heading = 'About Us',
        text = 'We are a leading real estate company dedicated to helping you find the perfect property. With decades of experience, we bring unparalleled expertise and a commitment to excellence to every transaction.',
        highlight1 = '10+ Years',
        highlight2 = '500+ Projects',
        highlight3 = '98% Satisfaction',
        imageUrl,
        bgColor = '#ffffff',
        textColor = '#111827',
        paddingTop = 80,
        paddingBottom = 80,
    } = content

    const highlights = [
        { label: highlight1, desc: 'of Excellence' },
        { label: highlight2, desc: 'Completed' },
        { label: highlight3, desc: 'Client Rating' },
    ]

    return (
        <section
            style={{
                backgroundColor: bgColor,
                paddingTop: `${paddingTop}px`,
                paddingBottom: `${paddingBottom}px`,
            }}
        >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

                    {/* Text column */}
                    <div className="space-y-6">
                        {/* Eyebrow */}
                        <span className="inline-block text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                            Who We Are
                        </span>

                        {/* Heading */}
                        <h2
                            style={{ color: textColor }}
                            className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight"
                        >
                            {heading}
                        </h2>

                        {/* Body */}
                        <p
                            style={{ color: textColor, opacity: 0.7 }}
                            className="text-sm sm:text-base leading-relaxed"
                        >
                            {text}
                        </p>

                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            {highlights.map((h, i) => (
                                <div key={i} className="text-center sm:text-left">
                                    <p className="text-xl sm:text-2xl font-extrabold text-blue-600">{h.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{h.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Image column */}
                    <div className="relative">
                        <div className="aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                            {imageUrl ? (
                                <img
                                    src={imageUrl}
                                    alt="About us"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-100 via-blue-50 to-indigo-100 flex items-center justify-center">
                                    <div className="text-center space-y-2">
                                        <div className="w-16 h-16 mx-auto bg-blue-200 rounded-2xl flex items-center justify-center">
                                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <p className="text-xs text-blue-400 font-medium">Add an image URL in the editor</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Decorative accent */}
                        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-blue-100 rounded-2xl -z-10 hidden sm:block" />
                    </div>
                </div>
            </div>
        </section>
    )
}
