export default function PublicHeroSection({ content }) {
    return (
        <section
            className="w-full py-24 px-8 text-center flex flex-col items-center justify-center min-h-[60vh] relative overflow-hidden"
            style={{
                backgroundColor: content.backgroundColor || '#f8fafc',
                color: content.textColor || '#0f172a'
            }}
        >
            <div className="z-10 max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
                    {content.title || 'Welcome'}
                </h1>
                <p className="text-xl md:text-2xl opacity-80 max-w-2xl mx-auto font-light leading-relaxed">
                    {content.subtitle || 'Building details that matter.'}
                </p>
                {content.showButton && (
                    <div className="pt-8">
                        <button className="px-8 py-4 bg-primary text-primary-foreground rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                            {content.buttonText || 'Get in Touch'}
                        </button>
                    </div>
                )}
            </div>
            {/* Background decoration */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-400 via-transparent to-transparent" />
        </section>
    )
}
