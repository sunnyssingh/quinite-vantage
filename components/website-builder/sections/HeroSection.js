import React from 'react'

export default function HeroSection({ content = {} }) {
    const {
        title = 'Welcome to Our Website',
        subtitle = 'Building the Future, One Project at a Time',
        ctaText = 'Explore Projects',
        ctaUrl = '#projects',
        bgImage,
        bgColor = '#1e293b',
        textColor = '#ffffff',
        paddingTop = 96,
        paddingBottom = 96,
        textAlign = 'center',
    } = content

    const sectionStyle = {
        backgroundColor: bgColor,
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        ...(bgImage
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.45)), url(${bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }
            : {}),
    }

    const alignClass =
        textAlign === 'center' ? 'text-center items-center' :
            textAlign === 'right' ? 'text-right items-end' :
                'text-left items-start'

    return (
        <section style={sectionStyle} className="w-full">
            <div className={`max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 ${alignClass}`}>

                {/* Eyebrow badge */}
                <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase w-fit"
                    style={{ background: 'rgba(255,255,255,0.15)', color: '#e2e8f0' }}
                >
                    Real Estate Experts
                </span>

                {/* Headline */}
                <h1
                    style={{ color: textColor }}
                    className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight max-w-3xl"
                >
                    {title}
                </h1>

                {/* Subtitle */}
                {subtitle && (
                    <p
                        style={{ color: textColor, opacity: 0.8 }}
                        className="text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed"
                    >
                        {subtitle}
                    </p>
                )}

                {/* CTA buttons */}
                {ctaText && (
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <a
                            href={ctaUrl || '#'}
                            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95"
                            style={{ background: '#3b82f6', color: '#ffffff' }}
                        >
                            {ctaText}
                        </a>
                        <a
                            href="#contact"
                            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-sm transition-all border"
                            style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.08)' }}
                        >
                            Contact Us
                        </a>
                    </div>
                )}
            </div>
        </section>
    )
}
