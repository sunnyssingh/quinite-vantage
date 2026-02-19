export default function HeroSection({ content }) {
    const bgImage = content.backgroundImage
    const bgColor = content.backgroundColor || '#f8fafc'
    const textColor = content.textColor || '#0f172a'
    const overlayOpacity = content.overlayOpacity || 0.5

    return (
        <div
            className="w-full relative min-h-[600px] flex items-center justify-center text-center px-8 py-20 overflow-hidden"
            style={{
                backgroundColor: bgColor,
                color: textColor,
            }}
        >
            {/* Background Image & Overlay */}
            {bgImage && (
                <>
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 transform hover:scale-105"
                        style={{ backgroundImage: `url(${bgImage})` }}
                    />
                    <div
                        className="absolute inset-0 bg-black/50"
                        style={{ opacity: overlayOpacity }}
                    />
                </>
            )}

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight drop-shadow-sm">
                    {content.title || 'Welcome to Our Website'}
                </h1>
                <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto font-light leading-relaxed">
                    {content.subtitle || 'We build dreams into reality.'}
                </p>
                {content.showButton && (
                    <button className="mt-8 px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg transition-all hover:scale-105 hover:shadow-xl hover:bg-primary/90 active:scale-95">
                        {content.buttonText || 'Contact Us'}
                    </button>
                )}
            </div>
        </div>
    )
}
